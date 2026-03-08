package repository

import (
	"audit-service/internal/store"
	"context"

	"github.com/jackc/pgx/v5"
)

type EvidenceRepo interface {
	InsertEvidenceHash(ctx context.Context, tx pgx.Tx, e store.EvidenceDetails) error
}

type CustodyRepo interface {
	InsertCustodyLog(ctx context.Context, tx pgx.Tx, c store.CustodyLog) error
}

type AuditRepo interface {
	InsertAuditLog(ctx context.Context, tx pgx.Tx, a store.AuditLog) error
}
