package utils

import (
	"context"
	"fmt"
	"log"
	"time"

	"sheduling-server/models"
	sub_model "sheduling-server/models/sub_models"
	"sheduling-server/repository"

	"github.com/google/uuid"
)

// RetentionScheduler manages automatic log archival based on retention policies
type RetentionScheduler struct {
	repo           repository.LogRepository
	retentionDays  int
	ticker         *time.Ticker
	stopChan       chan bool
	runImmediately bool
}

// RetentionSchedulerConfig provides configuration for the retention scheduler
type RetentionSchedulerConfig struct {
	RetentionDays  int  // Number of days to keep logs before archiving
	RunImmediately bool // If true, runs archival immediately on start (for testing)
}

// NewRetentionScheduler creates a new retention scheduler instance
func NewRetentionScheduler(repo repository.LogRepository, config RetentionSchedulerConfig) *RetentionScheduler {
	if config.RetentionDays <= 0 {
		config.RetentionDays = 365 // Default to 1 year
	}

	return &RetentionScheduler{
		repo:           repo,
		retentionDays:  config.RetentionDays,
		stopChan:       make(chan bool),
		runImmediately: config.RunImmediately,
	}
}

// Start begins the retention scheduler in the background
func (rs *RetentionScheduler) Start(ctx context.Context) {
	log.Printf("Starting retention scheduler (retention period: %d days)", rs.retentionDays)

	// If configured, run immediately for testing purposes
	if rs.runImmediately {
		go rs.runArchival(ctx)
	}

	// Calculate time until next midnight
	now := time.Now()
	nextMidnight := time.Date(now.Year(), now.Month(), now.Day()+1, 0, 0, 0, 0, now.Location())
	timeUntilMidnight := nextMidnight.Sub(now)

	// Wait until midnight before starting the daily ticker
	go func() {
		// Wait until first midnight
		time.Sleep(timeUntilMidnight)

		// Run archival at midnight
		rs.runArchival(ctx)

		// Set up 24-hour ticker for subsequent runs
		rs.ticker = time.NewTicker(24 * time.Hour)

		for {
			select {
			case <-rs.ticker.C:
				rs.runArchival(ctx)
			case <-rs.stopChan:
				log.Println("Retention scheduler stopped")
				return
			}
		}
	}()

	log.Printf("Retention scheduler will run daily at midnight (next run in %v)", timeUntilMidnight)
}

// Stop gracefully stops the retention scheduler
func (rs *RetentionScheduler) Stop() {
	log.Println("Stopping retention scheduler...")

	if rs.ticker != nil {
		rs.ticker.Stop()
	}

	rs.stopChan <- true
}

// runArchival performs the log archival process
func (rs *RetentionScheduler) runArchival(ctx context.Context) {
	log.Println("=== Starting automatic log archival ===")
	startTime := time.Now()

	// Calculate cutoff date
	cutoffDate := time.Now().AddDate(0, 0, -rs.retentionDays)
	cutoffDateStr := cutoffDate.Format("2006-01-02")

	log.Printf("Archiving logs older than %s (%d days)", cutoffDateStr, rs.retentionDays)

	// Archive old logs
	archivedCount, err := rs.repo.ArchiveLogsOlderThan(ctx, cutoffDateStr)
	if err != nil {
		log.Printf("ERROR: Failed to archive logs: %v", err)

		// Log the system error
		errorLog := &models.SystemLog{
			ID:           uuid.New().String(),
			Type:         sub_model.SYSTEM_ERROR,
			TimeDetected: time.Now(),
			LastUpdated:  time.Now(),
			Category:     "System",
			Severity:     sub_model.SEVERITY_ERROR,
			Metadata: map[string]interface{}{
				"message":                    fmt.Sprintf("Automatic log archival failed: %v", err),
				sub_model.META_ERROR_MESSAGE: err.Error(),
				"cutoff_date":                cutoffDateStr,
				"retention_days":             rs.retentionDays,
			},
		}

		if createErr := rs.repo.CreateLog(ctx, errorLog); createErr != nil {
			log.Printf("ERROR: Failed to log archival error: %v", createErr)
		}

		return
	}

	duration := time.Since(startTime)
	log.Printf("=== Log archival completed: %d logs archived in %v ===", archivedCount, duration)

	// Log the successful archival as a configuration change
	successLog := &models.SystemLog{
		ID:           uuid.New().String(),
		Type:         sub_model.CONFIGURATION_CHANGED,
		TimeDetected: time.Now(),
		LastUpdated:  time.Now(),
		Category:     "System",
		Severity:     sub_model.SEVERITY_INFO,
		Metadata: map[string]interface{}{
			"message":        fmt.Sprintf("Automatic log archival completed: %d logs archived", archivedCount),
			"archived_count": archivedCount,
			"cutoff_date":    cutoffDateStr,
			"retention_days": rs.retentionDays,
			"duration_ms":    duration.Milliseconds(),
		},
	}

	if err := rs.repo.CreateLog(ctx, successLog); err != nil {
		log.Printf("ERROR: Failed to log archival success: %v", err)
	}
}

// RunManualArchival allows manual triggering of the archival process (useful for testing or admin actions)
func (rs *RetentionScheduler) RunManualArchival(ctx context.Context) (int, error) {
	log.Println("Manual log archival triggered")

	cutoffDate := time.Now().AddDate(0, 0, -rs.retentionDays)
	cutoffDateStr := cutoffDate.Format("2006-01-02")
	archivedCount, err := rs.repo.ArchiveLogsOlderThan(ctx, cutoffDateStr)

	if err != nil {
		log.Printf("ERROR: Manual archival failed: %v", err)
		return 0, err
	}

	log.Printf("Manual archival completed: %d logs archived", archivedCount)
	return archivedCount, nil
}
