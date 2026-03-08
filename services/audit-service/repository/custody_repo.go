package repository

import (
	"audit-service/internal/store"
	"context"

	"github.com/jackc/pgx/v5"
)

type custodyRepo struct{}

func NewCustodyRepo() CustodyRepo {
	return &custodyRepo{}
}

func (c *custodyRepo) InsertCustodyLog(ctx context.Context, tx pgx.Tx, custodyLog store.CustodyLog) error {
	_, err := tx.Exec(ctx, `
			INSERT INTO integrity_schema.custody_logs (evidence_id, case_id, user_id, action_type, remarks, action_metadata)
			VALUES (@evidenceID, @caseID, @userID, @actionType, @remarks, @actionMetadata)
		`,
		pgx.NamedArgs{"evidenceID": custodyLog.EvidenceID, "caseID": custodyLog.CaseID,
			"userID": custodyLog.UserID, "actionType": custodyLog.ActionType,
			"remarks": custodyLog.Remarks, "actionMetadata": custodyLog.ActionMetadata})

	return err
}
