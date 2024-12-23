package main

import (
	"fmt"
	"net/http"
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
	var superimportant []byte;
	var mostRecentFrame []byte;
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
			if(len(message) <= 0){
				continue;
			}
			counter++
			if(counter == 1){
				superimportant = message;
				continue;
			}
			combo := make([]byte, len(superimportant))
			copy(combo, superimportant)
			combo = append(combo, message...)
			mostRecentFrame = combo;
			fmt.Println(messageType)
		}
	})

	app.GET("/receive", func(c *gin.Context) {
		ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			fmt.Println(err)
		}
		defer ws.Close()
		for {
			ws.WriteMessage(websocket.BinaryMessage, mostRecentFrame)
		}
	})

	app.Run(":8080")

}



// ------------------------------------------------------------------------------------

// package main

// import (
// 	"fmt"
// 	"net/http"
// 	"strconv"

// 	"os"

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
// 	var superimportant []byte;
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
// 			if(len(message) <= 0){
// 				continue;
// 			}
// 			counter++
// 			if(counter == 1){
// 				superimportant = message;
// 				continue;
// 			}
// 			// str := "data.mp4"
// 			str := "data" + strconv.Itoa(counter) + ".mp4"
// 			fmt.Println(str)
// 			file, err := os.OpenFile(str,os.O_RDWR|os.O_APPEND|os.O_CREATE, 0777)
// 			if err != nil {
// 				fmt.Println("err opening file: ", err)
// 			}
// 			combo := make([]byte, len(superimportant))
// 			copy(combo, superimportant)
// 			combo = append(combo, message...)
// 			fmt.Println(messageType)
// 			file.Write(combo)
// 			file.Close()
// 		}
// 	})

// 	app.GET("/receive", func(c *gin.Context) {
// 		ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
// 		if err != nil {
// 			fmt.Println(err)
// 		}
// 		defer ws.Close()
// 	})

// 	app.Run(":8080")

// }
