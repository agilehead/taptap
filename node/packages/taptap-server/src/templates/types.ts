export type EmailTemplate = {
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  createdAt: string;
  updatedAt: string;
};

export type EmailTemplateRow = {
  name: string;
  subject: string;
  body_html: string;
  body_text: string;
  created_at: string;
  updated_at: string;
};

export function mapRowToDomain(row: EmailTemplateRow): EmailTemplate {
  return {
    name: row.name,
    subject: row.subject,
    bodyHtml: row.body_html,
    bodyText: row.body_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type CreateEmailTemplate = {
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
};

export type UpdateEmailTemplate = {
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
};

export type EmailTemplateRepository = {
  findByName(name: string): EmailTemplate | null;
  findAll(): EmailTemplate[];
  create(data: CreateEmailTemplate): EmailTemplate;
  update(name: string, data: UpdateEmailTemplate): EmailTemplate | null;
  delete(name: string): boolean;
};
