package main

import (
	"audit-service/internal/config"
	"audit-service/internal/store"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	config := config.NewEnvDBConfig(5, 5)

	_, err := store.NewStorage(config, false)
	if err != nil {
		log.Fatal(err)
	}

	router := gin.Default()

	log.Printf("Service running on : %s\n", port)
	log.Fatal(http.ListenAndServe(fmt.Sprintf("0.0.0.0:%s", port), router))
}
