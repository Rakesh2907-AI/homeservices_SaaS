{{/*
Shared template helpers.
*/}}

{{- define "hs.namespace" -}}
{{- if .Values.tenant.slug -}}
tenant-{{ .Values.tenant.slug }}
{{- else -}}
{{ .Release.Namespace }}
{{- end -}}
{{- end -}}

{{- define "hs.labels" -}}
app.kubernetes.io/name: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
tenant-id: {{ .Values.tenant.id | quote }}
tenant-slug: {{ .Values.tenant.slug | quote }}
plan-tier: {{ .Values.tenant.planTier | quote }}
{{- end -}}

{{- define "hs.image" -}}
{{ .Values.image.registry }}/{{ .service }}:{{ .Values.image.tag }}
{{- end -}}
