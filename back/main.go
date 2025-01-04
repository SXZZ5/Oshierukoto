package main

import (
	"fmt"
	"net/http"

	// "os"
	// "strconv"
	"sync"
	"time"

	"encoding/json"

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

func findControlSignal(encjson []byte) map[string]any {
	jsoninfo := []map[string]any{}
	err := json.Unmarshal(encjson, &jsoninfo)
	if err != nil {
		panic(err)
	}
	for i := len(jsoninfo) - 1; i >= 0; i-- {
		tmp, ok := jsoninfo[i]["type"].(string)
		if ok && (tmp == "ptrUp" || tmp == "ptrDown" || tmp == "ptrLeave") {
			return jsoninfo[i]
		}
	}
	return nil
}

func adjustControlSignal(encjson []byte, control map[string]any) []byte {
	if control == nil {
		return encjson
	}
	jsoninfo := []map[string]any{}
	err := json.Unmarshal(encjson, &jsoninfo)
	if err != nil {
		panic(err)
	}
	if len(jsoninfo) <= 0 {
		return encjson
	}
	tmp := jsoninfo[0]["type"].(string)
	ok := tmp == "ptrUp" || tmp == "ptrDown" || tmp == "ptrLeave"
	if ok {
		return encjson
	} else {
		// deltaTime, ok := jsoninfo[0]["deltaTime"].(float64)
		// if !ok {
		// 	panic("deltaTime not a float64")
		// }
		// control["deltaTime"] = (deltaTime / 2)
		control["deltaTime"] = 0;
		combined := []map[string]any{control}
		combined = append(combined, jsoninfo...)
		marshalled, err := json.Marshal(combined)
		if err != nil {
			panic(err)
		}
		return marshalled
	}
}

func main() {
	app := gin.Default()
	var superimportant []byte
	var queue [][]byte
	var m sync.Mutex
	var cqueue [][]byte
	canvas_control := map[string]any{}
	canvas_control = nil

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
				jsoninfo := cqueue[0]
				tmp := findControlSignal(jsoninfo)
				if tmp != nil {
					canvas_control = tmp
				}
				cqueue = cqueue[1:]
			}
			queue = append(queue, combo)
			m.Unlock()

			// str := "./assets/data" + strconv.Itoa(counter) + ".mp4"
			// file, err := os.OpenFile(str, os.O_RDWR|os.O_CREATE, 0777)
			// if err != nil {
			// 	fmt.Println("err opening file: ", err)
			// }
			// file.Write(combo)
			// file.Close()
		}
	})

	app.GET("/canvas", func(c *gin.Context) {
		ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			fmt.Println(err)
		}
		defer ws.Close()
		cid := 0
		for {
			_, message, err := ws.ReadMessage()
			if err != nil {
				fmt.Println(err)
			}
			if len(message) <= 0 {
				continue
			}
			cid++
			// if cid == 1 {
			// 	continue;
			// }
			if !json.Valid(message) {
				continue
			}
			m.Lock()
			cqueue = append(cqueue, message)
			m.Unlock()
			// fmt.Println("canvas message:", messageType)
			// str := "./assets/canvas" + strconv.Itoa(cid) + ".json"
			// file, err := os.OpenFile(str, os.O_RDWR|os.O_CREATE|os.O_APPEND, 0777)
			// if err != nil {
			// 	fmt.Println("err opening file:", err)
			// }
			// file.Write(message)
			// file.Close()
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
		counter := 0
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
				// str := "./assets/sentdata" + strconv.Itoa(counter) + ".mp4"
				// file, err := os.OpenFile(str, os.O_RDWR|os.O_CREATE, 0777)
				// if err != nil {
				// 	fmt.Println("err opening file: ", err)
				// }
				m.Lock()
				acquired = true
				combo := queue[0]
				ws.WriteMessage(websocket.TextMessage, adjustControlSignal(cqueue[0], canvas_control))
				ws.WriteMessage(websocket.BinaryMessage, combo)
				m.Unlock()
				acquired = false
				ws.WriteMessage(websocket.TextMessage, []byte("renderReady"))
				// file.Write(combo)
				// file.Close()
				acquired = true
				m.Lock()
				acquired = true
				queue = queue[1:]
				cstart := cqueue[0]
				cqueue = cqueue[1:]
				m.Unlock()
				acquired = false
				tmp := findControlSignal(cstart)
				if tmp != nil {
					canvas_control = tmp
				}
				counter++
			}
		}
	})
	app.Run(":8080")
}
