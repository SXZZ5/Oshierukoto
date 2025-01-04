package main

import (
	"fmt"
	"net/http"
	"strconv"

	"os"
	"os/exec"

	// "strconv"
	"sync"
	"time"

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

func CanvastoMP4(file string, q *[][]byte) {
	cmd := exec.Command("ffmpeg", "-framerate", "20", "-i", file, "-c", "copy",
		"-movflags", "frag_keyframe+empty_moov+default_base_moof", file+".mp4")
	err := cmd.Run()
	if err != nil {
		fmt.Println(err)
	}
	fileContents, err := os.ReadFile(file + ".mp4")
	if err != nil {
		fmt.Println("err reading file: ", err)
	}
	*q = append(*q, fileContents)
}

func main() {
	app := gin.Default()
	var superimportant []byte
	var queue [][]byte
	var m sync.Mutex
	var cqueue [][]byte
	// canvas_control := map[string]any{}
	// canvas_control = nil

	app.GET("/", func(c *gin.Context) {
		ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			fmt.Println(err)
		}
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
			counter++
			if counter == 1 {
				superimportant = message
				continue
			}

			combo := make([]byte, len(superimportant))
			copy(combo, superimportant)
			combo = append(combo, message...)

			fmt.Println(messageType)
			m.Lock()
			if len(queue) >= 4 {
				queue = queue[1:]
				cqueue = cqueue[1:]
			}
			queue = append(queue, combo)
			m.Unlock()
		}
	})

	app.GET("/canvas", func(c *gin.Context) {
		ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			fmt.Println(err)
		}
		defer ws.Close()
		canvas_id := 1
		counter := 0

		for {
			_, message, err := ws.ReadMessage()
			if err != nil {
				fmt.Println(err)
			}
			if len(message) <= 0 {
				continue
			}
			// fmt.Println("canvas message:", messageType)

			counter++
			str := "./assets/canvas" + strconv.Itoa(canvas_id)
			file, err := os.OpenFile(str, os.O_RDWR|os.O_CREATE|os.O_APPEND, 0777)
			if err != nil {
				fmt.Println("err opening file:", err)
			}
			file.Write(message)
			file.Close()
			if counter == 100 {
				m.Lock()
				CanvastoMP4(str, &cqueue)
				m.Unlock()
				fmt.Println("one canvas fmp4 segment done")
				counter = 0
				canvas_id++
			}
		}
	})

	app.GET("/receive", func(c *gin.Context) {
		ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		fmt.Println("received connection")
		if err != nil {
			fmt.Println(err)
		}
		acquired := false
		defer func() {
			if acquired {
				m.Unlock()
			}
			ws.Close()
		}()
		counter := 1
		for {
			if len(queue) == 0 {
				time.Sleep(10 * time.Millisecond)
				continue
			}
			messageType, message, err := ws.ReadMessage()
			if err != nil {
				fmt.Println(err)
			}
			if messageType == websocket.TextMessage && string(message) == "ready" {
				m.Lock()
				acquired = true
				ws.WriteMessage(websocket.BinaryMessage, queue[0])
				ws.WriteMessage(websocket.BinaryMessage, cqueue[0])
				str := "./assets/sentdata" + strconv.Itoa(counter) + ".mp4"
				file, err := os.OpenFile(str, os.O_RDWR|os.O_CREATE, 0777)
				if err != nil {
					fmt.Println("err opening file: ", err)
				}
				file.Write(queue[0])
				str = "./assets/sentcanvas" + strconv.Itoa(counter) + ".mp4"
				file, err = os.OpenFile(str, os.O_RDWR|os.O_CREATE, 0777)
				if err != nil {
					fmt.Println("err opening file: ", err)
				}
				file.Write(cqueue[0])
				queue = queue[1:]
				cqueue = cqueue[1:]
				m.Unlock()
				acquired = false
				counter++
			}
		}
	})
	app.Run(":8080")
}
