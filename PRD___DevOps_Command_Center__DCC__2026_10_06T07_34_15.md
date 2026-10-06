
# 📋 PRODUCT REQUIREMENT DOCUMENT (PRD)
# Aplikasi: DevOps Command Center (DCC) — Web Application
# Versi: 1.0.0
# Tanggal: 6 Oktober 2026
# Disusun oleh: Product Manager & Software Analyst

---

# BAGIAN 1: PRODUCT BRIEF

---

## 1.1 Ringkasan Produk

**DevOps Command Center (DCC)** adalah web application berbasis SaaS yang menyatukan seluruh
workflow DevOps — CI/CD pipeline, infrastructure management, monitoring, incident response,
container orchestration, dan configuration management — ke dalam satu platform terintegrasi.

DCC menghilangkan kebutuhan DevOps Engineer untuk berpindah-pindah antara puluhan tools
(Jenkins, Grafana, Terraform, PagerDuty, dll.) dengan menyediakan unified dashboard yang
menghubungkan semua tools tersebut melalui API integration.

## 1.2 Visi Produk

> "Menjadi single pane of glass bagi setiap DevOps Engineer — satu platform untuk
> membangun, men-deploy, memonitor, dan merespons insiden dengan kecepatan dan
> kepercayaan diri maksimal."

## 1.3 Problem Statement

| No | Masalah | Dampak | Frekuensi |
|----|---------|--------|-----------|
| 1 | Tool fragmentation — rata-rata tim DevOps menggunakan 10-15 tools berbeda | Context switching tinggi, produktivitas turun 30-40% | Setiap hari |
| 2 | Alert fatigue — engineer menerima 100+ alert/hari dari berbagai sumber | 45% alert diabaikan, incident response lambat | Setiap hari |
| 3 | Deployment tracking sulit — tidak ada single source of truth | Rollback lambat, MTTR tinggi (rata-rata 2-4 jam) | Setiap deployment |
| 4 | Infrastructure drift — konfigurasi manual menyebabkan inkonsistensi | Downtime tidak terduga, security vulnerability | Mingguan |
| 5 | Incident response terfragmentasi — informasi tersebar di banyak channel | Koordinasi lambat, eskalasi terlambat | Setiap incident |
| 6 | Kurang visibility — tidak ada overview kesehatan seluruh sistem | Masalah terdeteksi terlambat, reactive bukan proactive | Setiap hari |

## 1.4 Target Pengguna (User Persona)

### Persona 1: DevOps Engineer (Primary User)
- **Nama:** Andi, 28 tahun
- **Role:** DevOps Engineer di startup fintech (tim 5 orang)
- **Pain Points:** Capek berpindah antar Jenkins, Grafana, AWS Console, Terraform, dan Slack setiap hari
- **Goals:** Ingin satu dashboard untuk melihat semua pipeline, infrastructure, dan monitoring
- **Tech Savviness:** Tinggi — familiar dengan CLI, YAML, Docker, Kubernetes

### Persona 2: Site Reliability Engineer (SRE)
- **Nama:** Budi, 32 tahun
- **Role:** SRE di perusahaan e-commerce (tim 15 orang)
- **Pain Points:** Alert fatigue, sulit melacak SLO/SLI, incident response lambat
- **Goals:** Ingin smart alerting, automated runbook, dan SLO tracking terpusat
- **Tech Savviness:** Sangat tinggi — expert di observability dan distributed systems

### Persona 3: Engineering Manager
- **Nama:** Citra, 35 tahun
- **Role:** VP of Engineering di perusahaan SaaS
- **Pain Points:** Kurang visibility terhadap deployment frequency, MTTR, dan team performance
- **Goals:** Ingin dashboard eksekutif dengan DORA metrics dan team analytics
- **Tech Savviness:** Menengah — lebih fokus pada metrics dan reporting

### Persona 4: Platform Engineer
- **Nama:** Dimas, 30 tahun
- **Role:** Platform Engineer di enterprise banking
- **Pain Points:** Sulit mengelola multi-cluster Kubernetes, secret management, dan compliance
- **Goals:** Ingin centralized platform untuk manage infrastructure dan enforce policies
- **Tech Savviness:** Sangat tinggi — expert di Kubernetes dan cloud architecture

## 1.5 Competitive Landscape

| Fitur | DCC | Backstage (Spotify) | Port (getport.io) | Cortex | Humanitec |
|-------|-----|---------------------|-------------------|--------|-----------|
| CI/CD Management | ✅ Full | ⚠️ Plugin-based | ✅ Full | ❌ | ✅ Full |
| Infrastructure Management | ✅ Full | ⚠️ Limited | ✅ Full | ❌ | ✅ Full |
| Monitoring & Observability | ✅ Built-in | ❌ | ⚠️ Limited | ✅ Full | ❌ |
| Incident Management | ✅ Built-in | ❌ | ⚠️ Limited | ⚠️ Limited | ❌ |
| Container/K8s Management | ✅ Full | ⚠️ Plugin | ✅ Full | ⚠️ Limited | ✅ Full |
| Secret Management | ✅ Built-in | ❌ | ⚠️ Limited | ❌ | ⚠️ Limited |
| AI/ML Anomaly Detection | ✅ Planned | ❌ | ❌ | ✅ Full | ❌ |
| Self-hosted Option | ✅ | ✅ | ❌ | ❌ | ✅ |
| Open Source | ⚠️ Core | ✅ | ❌ | ❌ | ⚠️ Partial |

**Diferensiasi DCC:**
- All-in-one platform (bukan hanya developer portal)
- Built-in monitoring & incident management (tidak perlu plugin)
- AI-powered anomaly detection & smart alerting
- Bahasa Indonesia support (lokalisasi untuk pasar Indonesia)

## 1.6 Success Metrics (KPI)

| Metrik | Baseline (Tanpa DCC) | Target (Dengan DCC) | Timeframe |
|--------|----------------------|---------------------|-----------|
| Deployment Frequency | 2-3x/minggu | 5-10x/minggu | 6 bulan |
| Lead Time for Changes | 3-5 hari | < 1 hari | 6 bulan |
| MTTR (Mean Time to Recovery) | 2-4 jam | < 30 menit | 6 bulan |
| Change Failure Rate | 15-25% | < 5% | 6 bulan |
| Alert-to-Incident Ratio | 100:1 | 10:1 | 3 bulan |
| Tool Context Switching | 10-15 tools/hari | 1 platform | Immediate |
| Engineer Satisfaction (NPS) | 30-40 | > 70 | 6 bulan |

## 1.7 Scope & Batasan

### Dalam Scope (In Scope)
- Web application (responsive untuk desktop & tablet)
- REST API + GraphQL + WebSocket
- Multi-cloud support (AWS, GCP, Azure)
- Integrasi dengan 30+ third-party tools
- Role-Based Access Control (RBAC)
- Multi-tenant architecture

### Di Luar Scope (Out of Scope) — v1.0
- Mobile native app (iOS/Android)
- On-premise deployment (Phase 4)
- White-label solution (Phase 4)
- Custom plugin marketplace (Phase 3)
- AI chatbot assistant

---

# BAGIAN 2: USER STORIES & ACCEPTANCE CRITERIA

---

## 2.1 Epic 1: Authentication & User Management

### US-AUTH-001: Registrasi & Login
**Sebagai** pengguna baru,
**Saya ingin** mendaftar dan login ke DCC,
**Agar** saya bisa mengakses platform.

**Acceptance Criteria:**
- [ ] User dapat registrasi dengan email + password
- [ ] User dapat login via SSO (Google, GitHub, GitLab)
- [ ] User dapat mengaktifkan MFA (TOTP/SMS)
- [ ] Session timeout setelah 30 menit inaktif
- [ ] Password harus memenuhi policy (min 8 char, uppercase, lowercase, number, special)
- [ ] Rate limiting: max 5 failed login attempts, lock 15 menit

### US-AUTH-002: Team & Workspace Management
**Sebagai** admin organisasi,
**Saya ingin** membuat workspace dan mengundang anggota tim,
**Agar** setiap tim memiliki environment yang terpisah.

**Acceptance Criteria:**
- [ ] Admin dapat membuat workspace baru
- [ ] Admin dapat invite member via email
- [ ] Admin dapat assign role (Admin, Editor, Viewer)
- [ ] Member dapat melihat hanya resource di workspace mereka
- [ ] Support multiple workspace per organisasi

---

## 2.2 Epic 2: CI/CD Pipeline Management

### US-CICD-001: Membuat Pipeline Baru
**Sebagai** DevOps Engineer,
**Saya ingin** membuat CI/CD pipeline baru dari template atau dari scratch,
**Agar** proses setup pipeline lebih cepat dan konsisten.

**Acceptance Criteria:**
- [ ] User dapat memilih dari 10+ pipeline templates (Node.js, Go, Python, Java, dll.)
- [ ] User dapat membuat pipeline dari scratch dengan visual editor
- [ ] User dapat mendefinisikan stages: Build → Test → Deploy → Release
- [ ] User dapat mengkonfigurasi trigger (push, PR, schedule, manual)
- [ ] Pipeline config disimpan sebagai YAML dan bisa di-version control
- [ ] Validasi config sebelum save (syntax check)

### US-CICD-002: Monitoring Pipeline Execution
**Sebagai** DevOps Engineer,
**Saya ingin** melihat status eksekusi pipeline secara real-time,
**Agar** saya bisa segera mengetahui jika ada masalah.

**Acceptance Criteria:**
- [ ] Dashboard menampilkan semua pipeline dengan status (Running, Success, Failed, Queued)
- [ ] Real-time log streaming per stage
- [ ] Visual pipeline graph dengan progress indicator per stage
- [ ] Notifikasi otomatis saat pipeline selesai atau gagal
- [ ] Filter & search pipeline berdasarkan nama, status, branch, author
- [ ] Durasi eksekusi per stage ditampilkan

### US-CICD-003: Rollback Deployment
**Sebagai** DevOps Engineer,
**Saya ingin** melakukan rollback ke versi sebelumnya dengan satu klik,
**Agar** recovery dari deployment yang gagal lebih cepat.

**Acceptance Criteria:**
- [ ] Sistem menyimpan 10 versi deployment terakhir
- [ ] User dapat memilih versi target untuk rollback
- [ ] Rollback otomatis jika health check gagal setelah deployment
- [ ] Rollback membutuhkan approval untuk environment production
- [ ] Rollback timeline ditampilkan dengan detail (siapa, kapan, dari versi berapa ke berapa)

### US-CICD-004: Approval Gate
**Sebagai** Team Lead,
**Saya ingin** meng-approve atau me-reject deployment ke production,
**Agar** ada quality gate sebelum release.

**Acceptance Criteria:**
- [ ] Approval gate dapat dikonfigurasi per environment
- [ ] Approver menerima notifikasi (Slack, Email) saat ada pending approval
- [ ] Support multi-approver (min 2 dari 3 approver)
- [ ] Approval memiliki timeout (auto-reject setelah 24 jam)
- [ ] Audit trail untuk setiap approval/rejection

---

## 2.3 Epic 3: Infrastructure Management

### US-INFRA-001: Infrastructure Topology View
**Sebagai** DevOps Engineer,
**Saya ingin** melihat visual topology map dari seluruh infrastructure,
**Agar** saya memahami arsitektur dan dependency antar service.

**Acceptance Criteria:**
- [ ] Topology map menampilkan semua resources (servers, databases, load balancers, dll.)
- [ ] Dependency lines antar resources ditampilkan
- [ ] Health status per resource ditampilkan (warna hijau/kuning/merah)
- [ ] Click pada resource menampilkan detail (specs, metrics, cost)
- [ ] Support zoom in/out dan drag
- [ ] Auto-discovery dari cloud provider API

### US-INFRA-002: Infrastructure as Code (IaC)
**Sebagai** DevOps Engineer,
**Saya ingin** menulis dan menjalankan IaC langsung dari DCC,
**Agar** provisioning infrastructure lebih konsisten dan terdokumentasi.

**Acceptance Criteria:**
- [ ] Built-in code editor dengan syntax highlighting (Terraform, Pulumi)
- [ ] Plan preview sebelum apply (dry-run)
- [ ] Cost estimation ditampilkan sebelum provisioning
- [ ] State management terintegrasi
- [ ] Drift detection otomatis (scheduled scan setiap 1 jam)
- [ ] Rollback ke state sebelumnya jika apply gagal

### US-INFRA-003: Environment Management
**Sebagai** DevOps Engineer,
**Saya ingin** mengelola multiple environment (dev, staging, production),
**Agar** setiap environment terisolasi dan terkontrol.

**Acceptance Criteria:**
- [ ] User dapat membuat environment baru (dev, staging, prod, custom)
- [ ] Setiap environment memiliki config & secret terpisah
- [ ] Promotion flow: dev → staging → prod dengan approval
- [ ] Environment comparison (diff antar environment)
- [ ] Resource quota per environment

---

## 2.4 Epic 4: Monitoring & Observability

### US-MON-001: Custom Dashboard Builder
**Sebagai** DevOps Engineer,
**Saya ingin** membuat custom monitoring dashboard,
**Agar** saya bisa fokus pada metrics yang paling relevan untuk tim saya.

**Acceptance Criteria:**
- [ ] Drag-and-drop widget builder
- [ ] Widget types: line chart, bar chart, gauge, table, heatmap, status indicator
- [ ] Data source selector (Prometheus, CloudWatch, custom metrics)
- [ ] Auto-refresh interval configurable (5s, 15s, 30s, 1m, 5m)
- [ ] Dashboard sharing & cloning
- [ ] Dashboard templates tersedia (Kubernetes, AWS, Database, dll.)

### US-MON-002: Smart Alerting
**Sebagai** DevOps Engineer,
**Saya ingin** menerima alert yang sudah diprioritaskan dan dikelompokkan,
**Agar** saya tidak mengalami alert fatigue.

**Acceptance Criteria:**
- [ ] Alert rules engine dengan kondisi (threshold, anomaly, absence)
- [ ] Alert grouping berdasarkan service/namespace/label
- [ ] Alert deduplication (alert yang sama tidak dikirim berulang)
- [ ] Alert routing ke channel berbeda berdasarkan severity
- [ ] Alert silencing/muting (scheduled maintenance window)
- [ ] Alert escalation jika tidak di-acknowledge dalam X menit

### US-MON-003: Log Aggregation & Search
**Sebagai** DevOps Engineer,
**Saya ingin** mencari dan menganalisis log dari semua service di satu tempat,
**Agar** troubleshooting lebih cepat.

**Acceptance Criteria:**
- [ ] Centralized log collection dari semua services
- [ ] Full-text search dengan query language (KQL-like)
- [ ] Log filtering berdasarkan service, severity, timestamp
- [ ] Log tailing (real-time streaming)
- [ ] Log correlation dengan traces dan metrics
- [ ] Log retention policy configurable

---

## 2.5 Epic 5: Incident Management

### US-INC-001: Incident Creation & Classification
**Sebagai** On-Call Engineer,
**Saya ingin** membuat incident baru (manual atau otomatis dari alert),
**Agar** setiap masalah tercatat dan ditangani dengan proper.

**Acceptance Criteria:**
- [ ] Incident dapat dibuat manual atau otomatis dari alert threshold
- [ ] Severity classification: P1 (Critical), P2 (High), P3 (Medium), P4 (Low)
- [ ] Auto-assign ke on-call engineer berdasarkan schedule
- [ ] Incident timeline otomatis mencatat semua aktivitas
- [ ] Related alerts, logs, dan metrics otomatis di-attach ke incident
- [ ] Notifikasi ke stakeholder berdasarkan severity

### US-INC-002: War Room & Collaboration
**Sebagai** On-Call Engineer,
**Saya ingin** berkolaborasi dengan tim dalam incident war room,
**Agar** koordinasi penanganan incident lebih efektif.

**Acceptance Criteria:**
- [ ] War room otomatis dibuat untuk incident P1 dan P2
- [ ] Real-time chat dalam war room
- [ ] Shared timeline dengan semua actions yang diambil
- [ ] Runbook integration — jalankan remediation steps dari war room
- [ ] Screen sharing / live metrics view
- [ ] Auto-create Slack/Teams channel untuk incident

### US-INC-003: Post-Mortem & Learning
**Sebagai** Engineering Manager,
**Saya ingin** membuat post-mortem report setelah incident selesai,
**Agar** tim bisa belajar dan mencegah incident serupa.

**Acceptance Criteria:**
- [ ] Post-mortem template (timeline, root cause, impact, action items)
- [ ] Auto-populated timeline dari incident data
- [ ] Action items tracking dengan assignee dan due date
- [ ] Post-mortem review workflow (draft → review → published)
- [ ] Searchable post-mortem library

---

## 2.6 Epic 6: Container & Kubernetes Management

### US-K8S-001: Cluster Overview
**Sebagai** Platform Engineer,
**Saya ingin** melihat overview semua Kubernetes cluster,
**Agar** saya bisa memonitor kesehatan dan resource utilization.

**Acceptance Criteria:**
- [ ] Dashboard menampilkan semua cluster dengan health status
- [ ] Resource utilization (CPU, Memory, Storage) per cluster/node/pod
- [ ] Namespace listing dengan resource quota
- [ ] Pod status overview (Running, Pending, Failed, CrashLoopBackOff)
- [ ] Event log per cluster
- [ ] Multi-cluster support

### US-K8S-002: Deployment Management
**Sebagai** DevOps Engineer,
**Saya ingin** mengelola Kubernetes deployments dari DCC,
**Agar** tidak perlu menggunakan kubectl untuk operasi umum.

**Acceptance Criteria:**
- [ ] List semua deployments dengan status dan replica count
- [ ] Scale up/down replicas dari UI
- [ ] Rolling update dengan progress indicator
- [ ] Rollback ke revision sebelumnya
- [ ] View pod logs dan exec into pod
- [ ] YAML editor untuk edit manifest

---

## 2.7 Epic 7: Configuration & Secret Management

### US-CFG-001: Centralized Configuration
**Sebagai** DevOps Engineer,
**Saya ingin** mengelola semua konfigurasi aplikasi dari satu tempat,
**Agar** konsisten dan mudah di-audit.

**Acceptance Criteria:**
- [ ] Key-value config store per environment
- [ ] Config versioning dengan diff view
- [ ] Config rollback ke versi sebelumnya
- [ ] Dynamic reload tanpa restart service
- [ ] Config inheritance (global → environment → service)
- [ ] Audit trail untuk setiap perubahan

### US-CFG-002: Secret Management
**Sebagai** DevOps Engineer,
**Saya ingin** menyimpan dan mengelola secrets (API keys, passwords, certificates) dengan aman,
**Agar** tidak ada secret yang hardcoded atau tersebar.

**Acceptance Criteria:**
- [ ] Secrets dienkripsi AES-256 at rest
- [ ] Secret access control per role/team
- [ ] Secret rotation policy (auto-rotate setiap X hari)
- [ ] Secret injection ke container/service secara otomatis
- [ ] Audit trail untuk setiap secret access
- [ ] Integration dengan HashiCorp Vault, AWS Secrets Manager

---

# BAGIAN 3: BUSINESS PROCESS FLOWS

---

## 3.1 Business Process: CI/CD Deployment Flow

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Developer   │     │   DCC        │     │  CI/CD       │     │  Cloud       │
│  (Git Push)  │     │  Platform    │     │  Engine      │     │  Provider    │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │                    │
       │ 1. Git Push/PR     │                    │                    │
       │───────────────────>│                    │                    │
       │                    │ 2. Trigger Pipeline│                    │
       │                    │───────────────────>│                    │
       │                    │                    │ 3. Build           │
       │                    │                    │──────┐             │
       │                    │                    │<─────┘             │
       │                    │                    │ 4. Run Tests       │
       │                    │                    │──────┐             │
       │                    │                    │<─────┘             │
       │                    │ 5. Test Results    │                    │
       │                    │<───────────────────│                    │
       │                    │                    │                    │
       │              [Test Pass?]               │                    │
       │              ┌─YES──┴──NO─┐             │                    │
       │              │            │             │                    │
       │              ▼            ▼             │                    │
       │     6. Request      7. Notify          │                    │
       │     Approval        Failure            │                    │
       │              │                          │                    │
       │     [Approved?]                         │                    │
       │     ┌─YES──┴──NO─┐                     │                    │
       │     │            │                      │                    │
       │     ▼            ▼                      │                    │
       │  8. Deploy    9. Cancel                 │                    │
       │     │                                   │                    │
       │     │ 10. Execute Deploy                │                    │
       │     │──────────────────────────────────>│                    │
       │     │                                   │ 11. Provision      │
       │     │                                   │───────────────────>│
       │     │                                   │ 12. Health Check   │
       │     │                                   │<───────────────────│
       │     │                                   │                    │
       │     │         [Health OK?]              │                    │
       │     │         ┌─YES──┴──NO─┐            │                    │
       │     │         │            │            │                    │
       │     │         ▼            ▼            │                    │
       │     │   13. Success   14. Auto          │                    │
       │     │   Notification  Rollback          │                    │
       │     │                                   │                    │
```

## 3.2 Business Process: Incident Management Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Monitoring  │    │     DCC      │    │  On-Call      │    │  Stakeholder │
│  System      │    │   Platform   │    │  Engineer     │    │  (Manager)   │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │                   │
       │ 1. Alert Fired    │                   │                   │
       │──────────────────>│                   │                   │
       │                   │ 2. Evaluate       │                   │
       │                   │ Alert Rules       │                   │
       │                   │──────┐            │                   │
       │                   │<─────┘            │                   │
       │                   │                   │                   │
       │             [Create Incident?]        │                   │
       │             ┌─YES──┴──NO──┐           │                   │
       │             │             │           │                   │
       │             ▼             ▼           │                   │
       │      3. Create      Suppress/         │                   │
       │      Incident       Group Alert       │                   │
       │             │                         │                   │
       │             │ 4. Classify Severity     │                   │
       │             │ (P1/P2/P3/P4)           │                   │
       │             │──────┐                  │                   │
       │             │<─────┘                  │                   │
       │             │                         │                   │
       │             │ 5. Notify On-Call       │                   │
       │             │────────────────────────>│                   │
       │             │                         │                   │
       │             │    [P1 or P2?]          │                   │
       │             │    ┌─YES──┴──NO─┐       │                   │
       │             │    │            │       │                   │
       │             │    ▼            │       │                   │
       │             │ 6. Create      │       │                   │
       │             │ War Room       │       │                   │
       │             │    │           │       │                   │
       │             │    │ 7. Notify Stakeholders                │
       │             │    │───────────────────────────────────────>│
       │             │    │           │       │                   │
       │             │    │           │       │ 8. Acknowledge    │
       │             │    │           │       │<──────────────────│
       │             │    │           │       │                   │
       │             │    │           │       │ 9. Investigate    │
       │             │    │           │       │ & Remediate       │
       │             │    │           │       │──────┐            │
       │             │    │           │       │<─────┘            │
       │             │    │           │       │                   │
       │             │    │           │       │ 10. Resolve       │
       │             │    │           │       │ Incident          │
       │             │    │           │       │──────────────────>│
       │             │    │           │       │                   │
       │             │ 11. Update Metrics     │                   │
       │             │ (MTTR, MTTA)           │                   │
       │             │──────┐                 │                   │
       │             │<─────┘                 │                   │
       │             │                        │                   │
       │             │ 12. Generate           │                   │
       │             │ Post-Mortem Template   │                   │
       │             │──────┐                 │                   │
       │             │<─────┘                 │                   │
```

## 3.3 Business Process: Infrastructure Provisioning Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  DevOps      │    │     DCC      │    │  IaC Engine  │    │  Cloud       │
│  Engineer    │    │   Platform   │    │  (Terraform) │    │  Provider    │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │                   │
       │ 1. Write/Edit     │                   │                   │
       │ IaC Code          │                   │                   │
       │──────────────────>│                   │                   │
       │                   │ 2. Validate       │                   │
       │                   │ Syntax            │                   │
       │                   │──────┐            │                   │
       │                   │<─────┘            │                   │
       │                   │                   │                   │
       │                   │ 3. Plan (Dry-Run) │                   │
       │                   │──────────────────>│                   │
       │                   │                   │ 4. Calculate      │
       │                   │                   │ Changes           │
       │                   │                   │──────────────────>│
       │                   │                   │<──────────────────│
       │                   │ 5. Show Plan +    │                   │
       │                   │ Cost Estimation   │                   │
       │                   │<──────────────────│                   │
       │ 6. Review Plan    │                   │                   │
       │<──────────────────│                   │                   │
       │                   │                   │                   │
       │ [Approve Plan?]   │                   │                   │
       │ ┌─YES──┴──NO─┐   │                   │                   │
       │ │            │    │                   │                   │
       │ ▼            ▼    │                   │                   │
       │ 7. Apply    Cancel│                   │                   │
       │ │                 │                   │                   │
       │ │────────────────>│                   │                   │
       │                   │ 8. Execute Apply  │                   │
       │                   │──────────────────>│                   │
       │                   │                   │ 9. Provision      │
       │                   │                   │──────────────────>│
       │                   │                   │<──────────────────│
       │                   │ 10. Update State  │                   │
       │                   │<──────────────────│                   │
       │                   │                   │                   │
       │                   │ 11. Update        │                   │
       │                   │ Topology Map      │                   │
       │                   │──────┐            │                   │
       │                   │<─────┘            │                   │
       │ 12. Confirmation  │                   │                   │
       │<──────────────────│                   │                   │
```

## 3.4 Business Process: Monitoring & Alert Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Application │    │  DCC         │    │  Alert       │    │  DevOps      │
│  / Infra     │    │  Monitoring  │    │  Engine      │    │  Engineer    │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │                   │
       │ 1. Emit Metrics   │                   │                   │
       │ & Logs            │                   │                   │
       │──────────────────>│                   │                   │
       │                   │ 2. Aggregate      │                   │
       │                   │ & Store           │                   │
       │                   │──────┐            │                   │
       │                   │<─────┘            │                   │
       │                   │                   │                   │
       │                   │ 3. Evaluate       │                   │
       │                   │ Alert Rules       │                   │
       │                   │──────────────────>│                   │
       │                   │                   │ 4. Check          │
       │                   │                   │ Thresholds        │
       │                   │                   │──────┐            │
       │                   │                   │<─────┘            │
       │                   │                   │                   │
       │                   │           [Threshold Breached?]       │
       │                   │           ┌─YES──┴──NO──┐            │
       │                   │           │             │            │
       │                   │           ▼             ▼            │
       │                   │    5. Deduplicate   Continue         │
       │                   │    & Group Alerts   Monitoring       │
       │                   │           │                          │
       │                   │           │ 6. Route Alert           │
       │                   │           │ by Severity              │
       │                   │           │─────────────────────────>│
       │                   │           │                          │
       │                   │           │         [Acknowledged?]  │
       │                   │           │         ┌─YES──┴──NO─┐   │
       │                   │           │         │            │   │
       │                   │           │         ▼            ▼   │
       │                   │           │    7. Resolve   8. Escalate
       │                   │           │                 (after X min)
```

## 3.5 Business Process: User Onboarding Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  New User    │    │     DCC      │    │  Auth        │    │  Integration │
│              │    │   Platform   │    │  (Keycloak)  │    │  Services    │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │                   │
       │ 1. Register /     │                   │                   │
       │ SSO Login         │                   │                   │
       │──────────────────>│                   │                   │
       │                   │ 2. Authenticate   │                   │
       │                   │──────────────────>│                   │
       │                   │ 3. Token Issued   │                   │
       │                   │<──────────────────│                   │
       │ 4. Welcome        │                   │                   │
       │ Dashboard         │                   │                   │
       │<──────────────────│                   │                   │
       │                   │                   │                   │
       │ 5. Create/Join    │                   │                   │
       │ Workspace         │                   │                   │
       │──────────────────>│                   │                   │
       │                   │                   │                   │
       │ 6. Connect        │                   │                   │
       │ Integrations      │                   │                   │
       │──────────────────>│                   │                   │
       │                   │ 7. OAuth Flow     │                   │
       │                   │──────────────────────────────────────>│
       │                   │ 8. Connected      │                   │
       │                   │<──────────────────────────────────────│
       │                   │                   │                   │
       │ 9. Setup First    │                   │                   │
       │ Pipeline/Dashboard│                   │                   │
       │──────────────────>│                   │                   │
       │                   │                   │                   │
       │ 10. Onboarding    │                   │                   │
       │ Complete          │                   │                   │
       │<──────────────────│                   │                   │
```

---

# BAGIAN 4: ENTITY RELATIONSHIP DIAGRAM (ERD)

---

## 4.1 ERD Overview

Berikut adalah Entity Relationship Diagram untuk database utama DCC:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DEVOPS COMMAND CENTER — ERD                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   Organization   │       │    Workspace     │       │      User        │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ PK id            │──1:N─>│ PK id            │       │ PK id            │
│    name          │       │ FK org_id        │       │    email         │
│    slug          │       │    name          │<─N:M─>│    full_name     │
│    plan_type     │       │    description   │       │    avatar_url    │
│    created_at    │       │    created_at    │       │    mfa_enabled   │
│    updated_at    │       │    updated_at    │       │    last_login_at │
└──────────────────┘       └────────┬─────────┘       │    created_at    │
                                    │                  └────────┬─────────┘
                                    │                           │
                           ┌────────▼─────────┐       ┌────────▼─────────┐
                           │ Workspace_Member  │       │    User_Role     │
                           ├──────────────────┤       ├──────────────────┤
                           │ PK id            │       │ PK id            │
                           │ FK workspace_id  │       │ FK user_id       │
                           │ FK user_id       │       │ FK role_id       │
                           │ FK role_id       │       │ FK workspace_id  │
                           │    joined_at     │       │    granted_at    │
                           └──────────────────┘       │    granted_by    │
                                                      └──────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
           ┌────────▼─────────┐    │      ┌────────▼─────────┐
           │    Pipeline      │    │      │   Environment    │
           ├──────────────────┤    │      ├──────────────────┤
           │ PK id            │    │      │ PK id            │
           │ FK workspace_id  │    │      │ FK workspace_id  │
           │    name          │    │      │    name          │
           │    description   │    │      │    type          │
           │    config_yaml   │    │      │    (dev/stg/prod)│
           │    trigger_type  │    │      │    is_protected  │
           │    status        │    │      │    created_at    │
           │    created_by    │    │      └────────┬─────────┘
           │    created_at    │    │               │
           └────────┬─────────┘    │               │
                    │              │      ┌────────▼─────────┐
           ┌────────▼─────────┐    │      │  Env_Variable    │
           │ Pipeline_Run     │    │      ├──────────────────┤
           ├──────────────────┤    │      │ PK id            │
           │ PK id            │    │      │ FK env_id        │
           │ FK pipeline_id   │    │      │    key           │
           │    run_number    │    │      │    value_enc     │
           │    status        │    │      │    is_secret     │
           │    trigger_by    │    │      │    version       │
           │    branch        │    │      │    updated_at    │
           │    commit_sha    │    │      └──────────────────┘
           │    started_at    │    │
           │    finished_at   │    │
           │    duration_ms   │    │
           └────────┬─────────┘    │
                    │              │
           ┌────────▼─────────┐    │
           │  Pipeline_Stage  │    │
           ├──────────────────┤    │
           │ PK id            │    │
           │ FK run_id        │    │
           │    name          │    │
           │    type          │    │
           │    (build/test/  │    │
           │     deploy)      │    │
           │    status        │    │
           │    order_index   │    │
           │    started_at    │    │
           │    finished_at   │    │
           │    log_url       │    │
           └────────┬─────────┘    │
                    │              │
           ┌────────▼─────────┐    │
           │  Stage_Approval  │    │
           ├──────────────────┤    │
           │ PK id            │    │
           │ FK stage_id      │    │
           │ FK approver_id   │    │
           │    status        │    │
           │    (pending/     │    │
           │     approved/    │    │
           │     rejected)    │    │
           │    comment       │    │
           │    decided_at    │    │
           └──────────────────┘    │
                                   │
           ┌───────────────────────┼───────────────────────┐
           │                       │                       │
  ┌────────▼─────────┐   ┌────────▼─────────┐   ┌────────▼─────────┐
  │   Deployment     │   │  Infrastructure  │   │    Service       │
  ├──────────────────┤   ├──────────────────┤   ├──────────────────┤
  │ PK id            │   │ PK id            │   │ PK id            │
  │ FK pipeline_run  │   │ FK workspace_id  │   │ FK workspace_id  │
  │ FK environment_id│   │    name          │   │    name          │
  │    version       │   │    type          │   │    description   │
  │    artifact_url  │   │    provider      │   │    repository_url│
  │    status        │   │    (aws/gcp/     │   │    language      │
  │    deployed_by   │   │     azure)       │   │    owner_team    │
  │    deployed_at   │   │    region        │   │    status        │
  │    rolled_back   │   │    status        │   │    created_at    │
  │    rollback_to   │   │    config_json   │   └────────┬─────────┘
  └──────────────────┘   │    cost_monthly  │            │
                         │    last_drift_at │   ┌────────▼─────────┐
                         │    created_at    │   │  Service_Metric  │
                         └──────────────────┘   ├──────────────────┤
                                                │ PK id            │
                                                │ FK service_id    │
                                                │    metric_name   │
                                                │    metric_value  │
                                                │    timestamp     │
                                                └──────────────────┘

  ┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
  │    Incident      │       │  Incident_Event  │       │   On_Call_       │
  ├──────────────────┤       ├──────────────────┤       │   Schedule       │
  │ PK id            │──1:N─>│ PK id            │       ├──────────────────┤
  │ FK workspace_id  │       │ FK incident_id   │       │ PK id            │
  │ FK service_id    │       │    event_type    │       │ FK workspace_id  │
  │ FK assigned_to   │       │    (created/     │       │ FK user_id       │
  │    title         │       │     assigned/    │       │    start_time    │
  │    description   │       │     escalated/   │       │    end_time      │
  │    severity      │       │     resolved)    │       │    rotation_type │
  │    (P1/P2/P3/P4) │       │    description   │       │    is_active     │
  │    status        │       │    actor_id      │       └──────────────────┘
  │    (open/ack/    │       │    created_at    │
  │     mitigated/   │       └──────────────────┘
  │     resolved)    │
  │    acknowledged_at│      ┌──────────────────┐
  │    resolved_at   │       │   Post_Mortem    │
  │    mttr_seconds  │──1:1─>├──────────────────┤
  │    mtta_seconds  │       │ PK id            │
  │    created_at    │       │ FK incident_id   │
  └──────────────────┘       │    root_cause    │
                             │    impact        │
                             │    timeline_json │
                             │    action_items  │
                             │    status        │
                             │    (draft/review/│
                             │     published)   │
                             │    author_id     │
                             │    published_at  │
                             └──────────────────┘

  ┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
  │  Alert_Rule      │       │     Alert        │       │  Notification    │
  ├──────────────────┤       ├──────────────────┤       ├──────────────────┤
  │ PK id            │──1:N─>│ PK id            │       │ PK id            │
  │ FK workspace_id  │       │ FK rule_id       │       │ FK user_id       │
  │ FK service_id    │       │ FK incident_id   │       │    type          │
  │    name          │       │    status        │       │    (alert/deploy/│
  │    condition     │       │    (firing/      │       │     approval/    │
  │    threshold     │       │     resolved/    │       │     incident)    │
  │    severity      │       │     silenced)    │       │    title         │
  │    channel       │       │    fired_at      │       │    message       │
  │    (slack/email/ │       │    resolved_at   │       │    channel       │
  │     pagerduty)   │       │    labels_json   │       │    is_read       │
  │    is_active     │       └──────────────────┘       │    created_at    │
  │    created_at    │                                  └──────────────────┘
  └──────────────────┘

  ┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
  │  K8s_Cluster     │       │  K8s_Namespace   │       │   K8s_Pod        │
  ├──────────────────┤       ├──────────────────┤       ├──────────────────┤
  │ PK id            │──1:N─>│ PK id            │──1:N─>│ PK id            │
  │ FK workspace_id  │       │ FK cluster_id    │       │ FK namespace_id  │
  │    name          │       │    name          │       │    name          │
  │    provider      │       │    cpu_limit     │       │    status        │
  │    version       │       │    mem_limit     │       │    (running/     │
  │    endpoint      │       │    pod_count     │       │     pending/     │
  │    status        │       │    created_at    │       │     failed)      │
  │    node_count    │       └──────────────────┘       │    cpu_usage     │
  │    cpu_total     │                                  │    mem_usage     │
  │    mem_total     │                                  │    restart_count │
  │    created_at    │                                  │    image         │
  └──────────────────┘                                  │    started_at    │
                                                        └──────────────────┘

  ┌──────────────────┐       ┌──────────────────┐
  │  Dashboard       │       │  Dashboard_      │
  ├──────────────────┤       │  Widget          │
  │ PK id            │──1:N─>├──────────────────┤
  │ FK workspace_id  │       │ PK id            │
  │ FK created_by    │       │ FK dashboard_id  │
  │    name          │       │    type          │
  │    description   │       │    (line/bar/    │
  │    is_template   │       │     gauge/table) │
  │    layout_json   │       │    title         │
  │    created_at    │       │    query         │
  │    updated_at    │       │    data_source   │
  └──────────────────┘       │    position_json │
                             │    config_json   │
                             └──────────────────┘

  ┌──────────────────┐       ┌──────────────────┐
  │  Audit_Log       │       │  Integration     │
  ├──────────────────┤       ├──────────────────┤
  │ PK id            │       │ PK id            │
  │ FK user_id       │       │ FK workspace_id  │
  │ FK workspace_id  │       │    type          │
  │    action        │       │    (github/slack/│
  │    resource_type │       │     aws/terraform│
  │    resource_id   │       │     /pagerduty)  │
  │    details_json  │       │    config_enc    │
  │    ip_address    │       │    status        │
  │    user_agent    │       │    (active/      │
  │    created_at    │       │     inactive/    │
  └──────────────────┘       │     error)       │
                             │    last_sync_at  │
                             │    created_at    │
                             └──────────────────┘

  ┌──────────────────┐
  │     Role         │
  ├──────────────────┤
  │ PK id            │
  │    name          │
  │    (admin/editor/│
  │     viewer)      │
  │    permissions   │
  │    _json         │
  │    is_system     │
  │    created_at    │
  └──────────────────┘
```

## 4.2 Relasi Antar Entitas

| Relasi | Tipe | Deskripsi |
|--------|------|-----------|
| Organization → Workspace | 1:N | Satu organisasi memiliki banyak workspace |
| Workspace ↔ User | N:M | User bisa di banyak workspace (via Workspace_Member) |
| User → User_Role | 1:N | User memiliki role berbeda per workspace |
| Workspace → Pipeline | 1:N | Satu workspace memiliki banyak pipeline |
| Pipeline → Pipeline_Run | 1:N | Satu pipeline memiliki banyak execution run |
| Pipeline_Run → Pipeline_Stage | 1:N | Satu run memiliki banyak stage |
| Pipeline_Stage → Stage_Approval | 1:N | Satu stage bisa memiliki banyak approver |
| Workspace → Environment | 1:N | Satu workspace memiliki banyak environment |
| Environment → Env_Variable | 1:N | Satu environment memiliki banyak config/secret |
| Workspace → Service | 1:N | Satu workspace memiliki banyak service |
| Service → Service_Metric | 1:N | Satu service memiliki banyak metrics |
| Workspace → Incident | 1:N | Satu workspace memiliki banyak incident |
| Incident → Incident_Event | 1:N | Satu incident memiliki banyak event timeline |
| Incident → Post_Mortem | 1:1 | Satu incident memiliki satu post-mortem |
| Alert_Rule → Alert | 1:N | Satu rule bisa menghasilkan banyak alert |
| Alert → Incident | N:1 | Banyak alert bisa terkait satu incident |
| K8s_Cluster → K8s_Namespace | 1:N | Satu cluster memiliki banyak namespace |
| K8s_Namespace → K8s_Pod | 1:N | Satu namespace memiliki banyak pod |
| Dashboard → Dashboard_Widget | 1:N | Satu dashboard memiliki banyak widget |
| Workspace → Integration | 1:N | Satu workspace memiliki banyak integrasi |

## 4.3 Database Indexes (Recommended)

| Tabel | Index | Tipe | Alasan |
|-------|-------|------|--------|
| Pipeline_Run | (pipeline_id, status, started_at) | Composite | Query pipeline runs by status |
| Alert | (rule_id, status, fired_at) | Composite | Query active alerts |
| Incident | (workspace_id, severity, status) | Composite | Filter incidents by severity |
| Audit_Log | (workspace_id, created_at) | Composite | Audit trail queries |
| Service_Metric | (service_id, metric_name, timestamp) | Composite | Time-series queries |
| K8s_Pod | (namespace_id, status) | Composite | Pod status filtering |
| Notification | (user_id, is_read, created_at) | Composite | Unread notifications |
| Deployment | (environment_id, deployed_at) | Composite | Deployment history |
| Env_Variable | (env_id, key) | Unique | Prevent duplicate keys |
| Workspace_Member | (workspace_id, user_id) | Unique | Prevent duplicate membership |

---

# BAGIAN 5: TECHNICAL ARCHITECTURE OVERVIEW

---

## 5.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │  Web App    │  │  REST API   │  │  WebSocket  │                │
│  │  (Next.js)  │  │  Consumers  │  │  Clients    │                │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                │
└─────────┼────────────────┼────────────────┼────────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY (Kong/Nginx)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │Rate Limit│  │  Auth    │  │  CORS    │  │  Logging │          │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVICES                               │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Auth     │  │ Pipeline │  │ Infra    │  │ Monitor  │          │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │          │
│  │(Keycloak)│  │ (Go)     │  │ (Go)     │  │ (Go)     │          │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Incident │  │ K8s      │  │ Config   │  │ Notif    │          │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │          │
│  │ (Go)     │  │ (Go)     │  │ (Go)     │  │ (Node.js)│          │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                    │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │PostgreSQL│  │  Redis   │  │ClickHouse│  │Elastic   │          │
│  │(Primary) │  │ (Cache)  │  │(Metrics) │  │search    │          │
│  └──────────┘  └──────────┘  └──────────┘  │(Logs)    │          │
│                                             └──────────┘          │
│  ┌──────────┐  ┌──────────┐                                       │
│  │  Kafka   │  │  S3/Minio│                                       │
│  │(Events)  │  │(Artifacts│                                       │
│  └──────────┘  └──────────┘                                       │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   EXTERNAL INTEGRATIONS                             │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ GitHub   │  │  Slack   │  │Terraform │  │PagerDuty │          │
│  │ GitLab   │  │  Teams   │  │ Pulumi   │  │OpsGenie  │          │
│  │Bitbucket │  │ Discord  │  │  Ansible │  │          │          │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │   AWS    │  │   GCP    │  │  Azure   │  │Prometheus│          │
│  │          │  │          │  │          │  │ Grafana  │          │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────────────────────┘
```

---

# BAGIAN 6: GLOSSARY

---

| Istilah | Definisi |
|---------|----------|
| CI/CD | Continuous Integration / Continuous Deployment — praktik otomasi build, test, dan deploy |
| IaC | Infrastructure as Code — mengelola infrastructure melalui kode, bukan manual |
| MTTR | Mean Time to Recovery — rata-rata waktu untuk memulihkan layanan setelah incident |
| MTTA | Mean Time to Acknowledge — rata-rata waktu untuk merespons incident |
| SLA | Service Level Agreement — perjanjian tingkat layanan |
| SLO | Service Level Objective — target internal untuk kualitas layanan |
| SLI | Service Level Indicator — metrik yang mengukur kualitas layanan |
| RBAC | Role-Based Access Control — kontrol akses berdasarkan peran |
| SSO | Single Sign-On — login sekali untuk akses ke banyak sistem |
| MFA | Multi-Factor Authentication — autentikasi dengan lebih dari satu faktor |
| DORA | DevOps Research and Assessment — framework pengukuran performa DevOps |
| K8s | Kubernetes — platform orkestrasi container |
| Drift | Perbedaan antara state yang diinginkan dan state aktual infrastructure |
| Runbook | Dokumen prosedur langkah-langkah untuk menangani incident tertentu |
| War Room | Ruang kolaborasi virtual untuk menangani incident kritis |
| Post-Mortem | Analisis setelah incident untuk mengidentifikasi root cause dan perbaikan |
| Helm | Package manager untuk Kubernetes |
| APM | Application Performance Monitoring |

---

**Dokumen ini adalah living document dan akan diperbarui seiring perkembangan produk.**

*Versi: 1.0.0 | Terakhir diperbarui: 6 Oktober 2026*
