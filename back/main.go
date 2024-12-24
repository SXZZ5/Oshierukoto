// package main

// import (
// 	"fmt"
// 	"net/http"
// 	"os"
// 	"strconv"

// 	"github.com/gin-gonic/gin"
// 	"github.com/gorilla/websocket"
// )

// var upgrader = websocket.Upgrader{
// 	ReadBufferSize:  1024,
// 	WriteBufferSize: 1024,
// 	CheckOrigin: func(r *http.Request) bool {
// 		return true
// 	},
// }

// func main() {
// 	app := gin.Default()
// 	var superimportant []byte
// 	var biglist [][]byte
// 	app.GET("/", func(c *gin.Context) {
// 		ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
// 		if err != nil {
// 			fmt.Println(err)
// 		}
// 		defer ws.Close()
// 		counter := 0
// 		for {
// 			messageType, message, err := ws.ReadMessage()
// 			if err != nil {
// 				fmt.Println(err)
// 			}
// 			if len(message) <= 0 {
// 				continue
// 			}
// 			counter++
// 			if counter == 1 {
// 				superimportant = message
// 				continue
// 			}

// 			biglist = append(biglist, message)
// 			fmt.Println(messageType)

// 			str := "data" + strconv.Itoa(counter) + ".mp4"
// 			file, err := os.OpenFile(str, os.O_RDWR|os.O_CREATE, 0777)
// 			if err != nil {
// 				fmt.Println("err opening file: ", err)
// 			}
// 			file.Write(message)
// 			file.Close()
// 		}
// 	})

// 	app.GET("/receive", func(c *gin.Context) {
// 		ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
// 		fmt.Println("received connection")
// 		if err != nil {
// 			fmt.Println(err)
// 		}
// 		sentinit := false
// 		defer ws.Close()
// 		counter := 5
// 		for {
// 			messageType, message, err := ws.ReadMessage()
// 			if err != nil {
// 				fmt.Println(err)
// 			}
// 			if messageType == websocket.TextMessage && string(message) == "ready" {
// 				if !sentinit {
// 					ws.WriteMessage(websocket.BinaryMessage, superimportant)
// 					sentinit = true
// 				}
// 				if counter < len(biglist) {
// 					str := "sentdata" + strconv.Itoa(counter) + ".mp4"
// 					file, err := os.OpenFile(str, os.O_RDWR|os.O_CREATE, 0777)
// 					if err != nil {
// 						fmt.Println("err opening file: ", err)
// 					}
// 					combo := make([]byte, len(superimportant))
// 					copy(combo, superimportant)
// 					combo = append(combo, biglist[counter]...)
// 					ws.WriteMessage(websocket.BinaryMessage, combo)
// 					file.Write(combo)
// 					file.Close()
// 					counter++
// 				}
// 			}
// 		}
// 	})
// 	app.Run(":8080")
// }

// ------------------------------------------------------------------------------------

package main

import (
	"fmt"
	"net/http"
	"os"
	"strconv"
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

func main() {
	app := gin.Default()
	var superimportant []byte
	var queue [][]byte
	var m sync.Mutex
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

			fmt.Println(messageType)
			m.Lock()
			if len(queue) >= 3 {
				queue = queue[1:]
			}
			queue = append(queue, message)
			m.Unlock()

			str := "data" + strconv.Itoa(counter) + ".mp4"
			file, err := os.OpenFile(str, os.O_RDWR|os.O_CREATE, 0777)
			if err != nil {
				fmt.Println("err opening file: ", err)
			}
			file.Write(message)
			file.Close()
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
		sentinit := false
		counter := 0
		for {
			if len(queue) == 0 {
				time.Sleep(400 * time.Millisecond)
				continue
			}
			messageType, message, err := ws.ReadMessage()
			if err != nil {
				fmt.Println(err)
			}
			if messageType == websocket.TextMessage && string(message) == "ready" {
				if !sentinit {
					ws.WriteMessage(websocket.BinaryMessage, superimportant)
					sentinit = true
				}
				str := "sentdata" + strconv.Itoa(counter) + ".mp4"
				file, err := os.OpenFile(str, os.O_RDWR|os.O_CREATE, 0777)
				if err != nil {
					fmt.Println("err opening file: ", err)
				}
				combo := make([]byte, len(superimportant))
				copy(combo, superimportant)
				combo = append(combo, queue[0]...)
				ws.WriteMessage(websocket.BinaryMessage, combo)
				file.Write(combo)
				file.Close()
				m.Lock()
				acquired = true
				queue = queue[1:]
				m.Unlock()
				acquired = false
				counter++
			}
		}
	})
	app.Run(":8080")
}
