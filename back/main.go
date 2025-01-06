package main

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"sync"

	// "strconv"

	"os"
	"os/exec"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type CanvasPacket struct {
	id   int
	data []byte
}

type FacecamPacket struct {
	id   int
	data []byte
}

type Publisher struct {
	name        string
	canvas_id   int
	facecam_id  int
	canvas_q    []CanvasPacket
	facecam_q   []FacecamPacket
	subscribers []chan<- []byte
	subdone     []<-chan bool
	streamEnd   context.Context
	M           sync.Mutex
	QMutex      sync.Mutex
}

func ConstructPublisher(pubName string, ctx context.Context) *Publisher {
	publisher := Publisher{}
	publisher.name = pubName
	publisher.canvas_id = 0
	publisher.facecam_id = 0
	publisher.canvas_q = make([]CanvasPacket, 0)
	publisher.facecam_q = make([]FacecamPacket, 0)
	publisher.subscribers = []chan<- []byte{}
	publisher.subdone = []<-chan bool{}
	publisher.streamEnd = ctx
	return &publisher
}

func (p *Publisher) Subscribe(data chan<- []byte, done <-chan bool) context.Context {
	(*p).M.Lock()
	(*p).subscribers = append((*p).subscribers, data)
	(*p).subdone = append((*p).subdone, done)
	(*p).M.Unlock()
	return (*p).streamEnd
}

func Dispatcher(pub *Publisher, trigger <-chan bool, ctx context.Context) {

	var g = func() {
		(*pub).M.Lock()
		(*pub).QMutex.Lock()
		defer (*pub).QMutex.Unlock()
		defer (*pub).M.Unlock()
		flen := len((*pub).facecam_q)
		clen := len((*pub).canvas_q)
		conditions := flen >= 3 && clen >= 3
		if !conditions {
			return
		}
		minlen := min(flen, clen)
		conditions = conditions && ((*pub).facecam_q[minlen-1].id == (*pub).canvas_q[minlen-1].id)
		if !conditions {
			return
		}

		facecam_copy := (*pub).facecam_q[0]
		canvas_copy := (*pub).canvas_q[0]

		(*pub).facecam_q = (*pub).facecam_q[1:]
		(*pub).canvas_q = (*pub).canvas_q[1:]

		if facecam_copy.id != canvas_copy.id {
			panic("facecam and canvas packets are not the same")
		}

		todel := []int{}

		for i := 0; i < len((*pub).subscribers); i++ {
			select {
			case <-(*pub).subdone[i]:
				todel = append(todel, i)
			default:
				(*pub).subscribers[i] <- facecam_copy.data
				(*pub).subscribers[i] <- canvas_copy.data
			}
		}

		revdel := []int{}
		for i := len(todel) - 1; i >= 0; i-- {
			revdel = append(revdel, todel[i])
		}

		for _, i := range revdel {
			(*pub).subscribers = append((*pub).subscribers[:i], (*pub).subscribers[i+1:]...)
			(*pub).subdone = append((*pub).subdone[:i], (*pub).subdone[i+1:]...)
		}
		return
	}

	for {
		select {
		case <-trigger:
			g()
		case <-ctx.Done():
			return
		}
	}
}

func CanvastoMP4(pubName string, canvas_data *[]byte) *[]byte {
	cwd, err := os.Getwd()
	if err != nil {
		fmt.Println("Error getting current directory:", err)
		return nil
	}
	path := filepath.Join(cwd, "assets")
	path = filepath.Join(path, "canvas_temp_"+pubName)
	fmt.Println("path: ", path)

	file, err := os.OpenFile(path, os.O_RDWR|os.O_CREATE, 0777)
	if err != nil {
		fmt.Println("err opening dumping network packet to file:", err)
	}
	file.Write(*canvas_data)
	file.Close()

	vidpath := filepath.Join(cwd, "assets")
	vidpath = filepath.Join(vidpath, "canvas_out_"+pubName+".mp4")
	cmd := exec.Command("ffmpeg", "-y", "-framerate", "20", "-i", path, "-c", "copy",
		"-movflags", "frag_keyframe+empty_moov+default_base_moof", vidpath)
	err = cmd.Run()
	if err != nil {
		fmt.Println(err)
	}
	fileContents, err := os.ReadFile(vidpath)
	if err != nil {
		fmt.Println("err reading file: ", err)
	}
	return &fileContents
}

func main() {
	app := gin.Default()

	Publishers := map[string]*Publisher{}
	Superimportant := map[string][]byte{}

	app.GET("/publisher/:name", func(c *gin.Context) {
		pubName := c.Param("name")
		_, ok := Publishers[pubName]
		if ok {
			c.String(http.StatusBadRequest, "publisher already exists")
			return
		}
		fmt.Println("publisher name: ", pubName)
		ctx, cancel := context.WithCancel(context.Background())
		Publishers[pubName] = ConstructPublisher(pubName, ctx)
		trigger := make(chan bool, 20)
		go Dispatcher(Publishers[pubName], trigger, ctx)
		ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			fmt.Println(err)
		}
		defer cancel()
		defer ws.Close()
		counter := 0
		for {
			messageType, message, err := ws.ReadMessage()
			if err != nil {
				fmt.Println(err)
			}
			if len(message) <= 0 {
				continue
			}
			if counter == 0 {
				str := "./assets/firstpacket.mp4"
				file, err := os.OpenFile(str, os.O_RDWR|os.O_CREATE, 0777)
				if err != nil {
					fmt.Println("err opening file:", err)
				}
				file.Write(message)
				file.Close()
				Superimportant[pubName] = message
				counter = 1
				continue
			}

			combo := make([]byte, len(Superimportant[pubName]))
			copy(combo, Superimportant[pubName])
			combo = append(combo, message...)
			ptr := Publishers[pubName]
			(*ptr).facecam_id = (*ptr).facecam_id + 1
			(*ptr).QMutex.Lock()
			(*ptr).facecam_q = append((*ptr).facecam_q, FacecamPacket{id: (*ptr).facecam_id, data: combo})
			(*ptr).QMutex.Unlock()

			trigger <- true

			str := "./assets/invid" + strconv.Itoa((*ptr).facecam_id) + ".mp4"
			file, err := os.OpenFile(str, os.O_RDWR|os.O_CREATE, 0777)
			if err != nil {
				fmt.Println("err opening dumping network packet to file:", err)
			}
			file.Write(combo)
			file.Close()

			fmt.Println(messageType)
		}
	})

	app.GET("/publisher/:name/canvas", func(c *gin.Context) {
		name := c.Param("name")
		ptr, ok := Publishers[name]
		if !ok {
			c.String(http.StatusBadRequest, "publisher not found")
			return
		}

		ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			fmt.Println(err)
		}
		defer ws.Close()
		hold := []byte{}
		counter := 0
		for {
			_, message, err := ws.ReadMessage()
			if err != nil {
				fmt.Println(err)
			}
			if len(message) <= 0 {
				continue
			}
			if counter == 0 {
				hold = message
				counter++
				continue
			}

			if counter == 1 {
				message = append(hold, message...)
				counter++
			}

			fmp4 := CanvastoMP4(name, &message)
			if fmp4 == nil {
				continue
			}

			fmt.Println("one canvas fmp4 segment done")
			(*ptr).canvas_id = (*ptr).canvas_id + 1
			(*ptr).QMutex.Lock()
			(*ptr).canvas_q = append((*ptr).canvas_q, CanvasPacket{id: (*ptr).canvas_id, data: *fmp4})
			(*ptr).QMutex.Unlock()

			str := "./assets/outvid" + strconv.Itoa((*ptr).canvas_id) + ".mp4"
			file, err := os.OpenFile(str, os.O_RDWR|os.O_CREATE, 0777)
			if err != nil {
				fmt.Println("err opening dumping network packet to file:", err)
			}
			file.Write(*fmp4)
			file.Close()
		}
	})

	app.GET("/receiver/:name", func(c *gin.Context) {
		name := c.Param("name")
		ptr, ok := Publishers[name]
		if !ok {
			c.String(http.StatusBadRequest, "publisher not found")
			return
		}
		data := make(chan []byte, 20)
		done := make(chan bool, 20)
		ctx := (*ptr).Subscribe(data, done)
		ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		fmt.Println("received connection")
		if err != nil {
			fmt.Println(err)
		}
		defer func() {
			done <- true
			ws.Close()
		}()
		for {
			select {
			case received := <-data:
				ws.WriteMessage(websocket.BinaryMessage, received)
			case <-ctx.Done():
				return
			}
		}
	})
	app.Run(":8080")
}
