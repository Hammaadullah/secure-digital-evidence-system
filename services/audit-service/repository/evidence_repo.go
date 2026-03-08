package repository

import (
	"audit-service/internal/store"
	"context"

	"github.com/jackc/pgx/v5"
)

type evidenceRepo struct{}

func NewEvidenceRepo() EvidenceRepo {
	return &evidenceRepo{}
}

func (r *evidenceRepo) InsertEvidenceHash(ctx context.Context, tx pgx.Tx, e store.EvidenceDetails) error {
	_, err := tx.Exec(ctx, `
			INSERT INTO integrity_schema.evidence_hashes (evidence_id, evidence_public_ic, file_hash, algorithm)
			VALUES (@evidenceID, @evidencePublicID, @fileHash, @algorithm)
		`, pgx.NamedArgs{"evidenceID": e.EvidenceID, "evidencePublicID": e.EvidencePublicID, "fileHash": e.FileHash, "algorithm": e.Algorithm})

	return err
}
