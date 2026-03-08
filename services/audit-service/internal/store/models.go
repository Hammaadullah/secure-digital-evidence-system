package store

type EvidenceDetails struct {
	EvidenceID       int64
	EvidencePublicID string
	Algorithm        string
	FileHash         string
}

type EvidenceRegistrationDetails struct {
	EvidenceID       int64
	EvidencePublicID string
	Algorithm        string
	FileHash         string
	CaseID           int64
	UserID           int64
	ActionType       int32
	Remarks          string
	// jsonb data
	ActionMetadata string
	ServiceName    string
	IPAddress      string
}

type CustodyLog struct {
	EvidenceID int64
	CaseID     int64
	UserID     int64
	ActionType int32
	Remarks    string
	// jsonb data
	ActionMetadata string
}

type AuditLog struct {
	UserID      int64
	CaseID      int64
	EvidenceId  int64
	ActionType  int32
	ServiceName string
	IPAddress   string
}
