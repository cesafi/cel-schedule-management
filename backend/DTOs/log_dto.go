package dtos

import sub_model "sheduling-server/models/sub_models"

// LogQueryInput represents the query parameters for fetching logs
type LogQueryInput struct {
	Limit     int               `form:"limit"`
	Offset    int               `form:"offset"`
	LogType   sub_model.LogType `form:"logType"`
	UserID    string            `form:"userId"`
	StartDate string            `form:"startDate"` // RFC3339 format
	EndDate   string            `form:"endDate"`   // RFC3339 format
}

// LogListResponse represents the response for listing logs
type LogListResponse struct {
	Logs  interface{} `json:"logs"`
	Total int         `json:"total"`
}
