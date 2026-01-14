package firebase

import (
	"context"
	"fmt"
	"time"

	"sheduling-server/models"
	sub_model "sheduling-server/models/sub_models"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
)

type eventScheduleRepo struct {
	firestore *firestore.Client
}

const eventsCollection = "events"

// CreateEvent adds a new event schedule to Firestore
func (r *eventScheduleRepo) CreateEvent(ctx context.Context, event *models.EventSchedule) error {
	if event.ID == "" {
		// Auto-generate ID if not provided
		docRef := r.firestore.Collection(eventsCollection).NewDoc()
		event.ID = docRef.ID
	}

	_, err := r.firestore.Collection(eventsCollection).Doc(event.ID).Set(ctx, event)
	if err != nil {
		return fmt.Errorf("failed to create event: %v", err)
	}
	return nil
}

// GetEventByID retrieves an event by its ID
func (r *eventScheduleRepo) GetEventByID(ctx context.Context, id string) (*models.EventSchedule, error) {
	docSnap, err := r.firestore.Collection(eventsCollection).Doc(id).Get(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get event: %v", err)
	}

	var event models.EventSchedule
	if err := docSnap.DataTo(&event); err != nil {
		return nil, fmt.Errorf("failed to parse event data: %v", err)
	}

	event.ID = docSnap.Ref.ID
	return &event, nil
}

// UpdateEvent updates an existing event
func (r *eventScheduleRepo) UpdateEvent(ctx context.Context, event *models.EventSchedule) error {
	_, err := r.firestore.Collection(eventsCollection).Doc(event.ID).Set(ctx, event)
	if err != nil {
		return fmt.Errorf("failed to update event: %v", err)
	}
	return nil
}

// DeleteEvent removes an event from Firestore
func (r *eventScheduleRepo) DeleteEvent(ctx context.Context, id string) error {
	_, err := r.firestore.Collection(eventsCollection).Doc(id).Delete(ctx)
	if err != nil {
		return fmt.Errorf("failed to delete event: %v", err)
	}
	return nil
}

// ListEvent retrieves all events
func (r *eventScheduleRepo) ListEvent(ctx context.Context) ([]*models.EventSchedule, error) {
	iter := r.firestore.Collection(eventsCollection).Documents(ctx)
	defer iter.Stop()

	var events []*models.EventSchedule
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("failed to iterate events: %v", err)
		}

		var event models.EventSchedule
		if err := doc.DataTo(&event); err != nil {
			return nil, fmt.Errorf("failed to parse event data: %v", err)
		}

		event.ID = doc.Ref.ID
		events = append(events, &event)
	}

	return events, nil
}

// AddVolunteerStatus adds a volunteer status to an event (check-in)
func (r *eventScheduleRepo) AddVolunteerStatus(ctx context.Context, eventID string, status *sub_model.ScheduleStatus) error {
	// Get the event first
	event, err := r.GetEventByID(ctx, eventID)
	if err != nil {
		return fmt.Errorf("failed to get event: %v", err)
	}

	// Append the new status
	event.Statuses = append(event.Statuses, *status)
	event.LastUpdated = time.Now()

	// Update the event
	if err := r.UpdateEvent(ctx, event); err != nil {
		return fmt.Errorf("failed to add volunteer status: %v", err)
	}

	return nil
}

// UpdateVolunteerStatus updates a volunteer status in an event (check-out)
func (r *eventScheduleRepo) UpdateVolunteerStatus(ctx context.Context, eventID string, volunteerID string, status *sub_model.ScheduleStatus) error {
	// Get the event first
	event, err := r.GetEventByID(ctx, eventID)
	if err != nil {
		return fmt.Errorf("failed to get event: %v", err)
	}

	// Find and update the volunteer's status
	found := false
	for i, s := range event.Statuses {
		if s.VolunteerID == volunteerID {
			// Update the status (typically for check-out)
			event.Statuses[i].TimeOut = status.TimeOut
			event.Statuses[i].TimeOutType = status.TimeOutType
			found = true
			break
		}
	}

	if !found {
		return fmt.Errorf("volunteer status not found for volunteer ID: %s", volunteerID)
	}

	event.LastUpdated = time.Now()

	// Update the event
	if err := r.UpdateEvent(ctx, event); err != nil {
		return fmt.Errorf("failed to update volunteer status: %v", err)
	}

	return nil
}

// GetAllStatusOfVolunteer gets the statuses of a volunteer in all events
func (r *eventScheduleRepo) GetAllStatusOfVolunteer(ctx context.Context, id string) ([]*models.EventSchedule, error) {
	// Query events where the volunteer has a status
	iter := r.firestore.Collection(eventsCollection).Documents(ctx)
	defer iter.Stop()

	var events []*models.EventSchedule
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("failed to iterate events: %v", err)
		}

		var event models.EventSchedule
		if err := doc.DataTo(&event); err != nil {
			return nil, fmt.Errorf("failed to parse event data: %v", err)
		}

		event.ID = doc.Ref.ID

		// Check if this volunteer has any status in this event
		hasStatus := false
		for _, status := range event.Statuses {
			if status.VolunteerID == id {
				hasStatus = true
				break
			}
		}

		// Only include events where the volunteer has a status
		if hasStatus {
			events = append(events, &event)
		}
	}

	return events, nil
}

// GetAllStatusOfDepartment gets the statuses of all volunteers in a department across all events
func (r *eventScheduleRepo) GetAllStatusOfDepartment(ctx context.Context, dept_id string) ([]*models.EventSchedule, error) {
	// Query events where the department is assigned
	iter := r.firestore.Collection(eventsCollection).
		Where("assignedGroups", "array-contains", dept_id).
		Documents(ctx)
	defer iter.Stop()

	var events []*models.EventSchedule
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("failed to iterate events: %v", err)
		}

		var event models.EventSchedule
		if err := doc.DataTo(&event); err != nil {
			return nil, fmt.Errorf("failed to parse event data: %v", err)
		}

		event.ID = doc.Ref.ID
		events = append(events, &event)
	}

	return events, nil
}
