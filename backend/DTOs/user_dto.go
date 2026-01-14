package dtos

// DTOS for the User things

// For creating a user, a user has to be connected to a volunteer data 1 to 1
type CreateUser_Input struct {
}

// Get Detailed Information about the User Details
type GetUserByID_Output struct {
}

// Input box for updating the User,
// has to handle nullability
type UpdateUser_Input struct {
}

// Gives a summary of the Users (Undetailed)
type ListUser_Output struct {
}
