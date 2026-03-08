package store

import (
	"audit-service/internal/config"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
)

type Storage struct {
	DB *sqlx.DB
}

func NewStorage(config *config.EnvDBConfig, setLimits bool) (*Storage, error) {
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=false", config.GetHost(), config.GetPort(), config.GetUsername(), config.GetPassword(), config.GetDatabase())
	const tries = 5
	const timeout = 2

	// prepare the driver. Lazy doesn't actually connect.
	db, err := sqlx.Open("pgx", connStr)
	if err != nil {
		return nil, err
	}

	// Start loop to keep try to connect to db with a timeout.
	for i := range tries {
		err := db.Ping()
		// db connection good.
		if err == nil {
			return &Storage{db}, nil
		}

		fmt.Printf("Database not ready... restarting in %ds (%d/%d)\n", timeout, i+1, tries)
		time.Sleep(timeout * time.Second)
	}

	return nil, fmt.Errorf("could not connect to database after %d retires: %v", tries, err)
}

func (s *Storage) RegisterEvidenceHash(evidenceDetails *EvidenceDetails) error {
	query := `
		INSERT INTO integrity_schema.evidence_hashes (evidence_id, evidence_public_id, algorithm, file_hash)
		VALUES ($1, $2, $3, $4)
	`
	_, err := s.DB.Exec(query, evidenceDetails.EvidenceID, evidenceDetails.EvidencePublicID, evidenceDetails.Algorithm, evidenceDetails.FileHash)

	// err is either nil or `error` in both case its what we want to return.
	return err
}

func (s *Storage) InsertCustodyLog(custodyLog *CustodyLog) error {
	query := `
		INSERT INTO integrity_schema.custody_logs (evidence_id, case_id, user_id, action_type, remarks, action_metadata)
		VALUES ($1, $2, $3, $4, $5, $6)
	`

	_, err := s.DB.Exec(query,
		custodyLog.EvidenceID,
		custodyLog.CaseID,
		custodyLog.UserID,
		custodyLog.ActionType,
		custodyLog.Remarks,
		custodyLog.ActionMetadata)

	return err
}

func (s *Storage) InsertAuditLog(auditLog *AuditLog) error {
	query := `
		INSERT INTO integrity_schema.audit_logs (user_id, case_id, evidence_id, action_type, service_name, ip_address)
		VALUES ($1, $2, $3, $4, $5, $6)
	`

	_, err := s.DB.Exec(query,
		auditLog.UserID,
		auditLog.CaseID,
		auditLog.EvidenceId,
		auditLog.ActionType,
		auditLog.ServiceName,
		auditLog.IPAddress)

	return err
}
