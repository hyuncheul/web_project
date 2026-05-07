# 해외축구 통합 정보 대시보드

Football-data.org API 데이터를 PostgreSQL에 적재한 뒤, Next.js 대시보드에서 리그별 예정/지난 경기, 순위, 득점 순위를 한 화면에서 확인할 수 있는 포트폴리오용 프로젝트입니다.

단순한 API 프록시가 아니라 **외부 API 수집 → 정제 → DB 적재 → 조회 → 시각화** 흐름을 한 저장소 안에서 보여주는 데 초점을 맞췄습니다.

## 주요 기능

- Football-data.org API v4 연동 (`/competitions/{league}/matches | standings | scorers`)
- PostgreSQL + Prisma 기반 영속 저장
- `npm run refresh:data` 한 번으로 5+1개 리그 데이터를 일괄 적재
- 예정/종료 경기를 `status` 값 기준으로 분리 (SCHEDULED·TIMED·IN_PLAY·PAUSED ↔ FINISHED)
- 리그별 순위 및 득점 순위 조회
- Next.js App Router의 Parallel Routes(`@aftergame`, `@lastgame`, `@team`, `@player`)로 4분할 대시보드 구성
- 리그 탭 전환 / 더보기·접기 / UTC → KST 변환 / 팀 엠블럼 표시

## 데이터 흐름

```
Football-data.org API
    ↓  (npm run refresh:data)
src/lib/refresh.js  ─ 정제(transform.js) ─ Prisma upsert
    ↓
PostgreSQL (League / Match / Standing / Scorer)
    ↓
src/lib/queries.js  ─ 평면 row → 패널용 중첩 구조로 변환
    ↓
Next.js Parallel Routes (Server Component)
    ↓
대시보드 UI (src/components/panels/*)
```

## DB 설계 요약

| 모델 | 고유 키 | 비고 |
| --- | --- | --- |
| `League` | `(code, season)` | 리그 메타. refresh 시 같이 upsert |
| `Match` | `apiMatchId` | 경기 단위. `status` 로 예정/종료 구분 |
| `Standing` | `(leagueCode, season, teamId)` | 시즌 누적 순위 |
| `Scorer` | `(leagueCode, season, playerId)` | 선수별 시즌 득점 순위 |

전체 정의는 [`prisma/schema.prisma`](prisma/schema.prisma) 를 참고하세요.

## 디렉토리 구조

```
prisma/
  schema.prisma            # Prisma 스키마 (League/Match/Standing/Scorer)
scripts/
  refresh-data.js          # npm run refresh:data 진입점 (CLI)
src/
  app/
    api/tasks/refresh/     # POST /api/tasks/refresh 수동 트리거 (옵션)
    main/                  # Parallel Routes 대시보드
      @aftergame/          # 예정 경기 슬롯
      @lastgame/           # 지난 경기 슬롯
      @team/               # 리그 순위 슬롯
      @player/             # 득점 순위 슬롯
  components/panels/       # 패널 4종 (UI는 db.json 시절 그대로 유지)
  data/leagues.js          # 리그 코드/이름 정의
  lib/
    prisma.js              # Prisma Client 싱글톤
    refresh.js             # 외부 API 호출 + upsert 파이프라인
    queries.js             # 화면용 DB 조회 함수
    transform.js           # 가공 / 평면↔중첩 변환
    scheduler.js           # 옵션: 15분 주기 자동 새로고침 (기본 OFF)
    time.js, league-label.js
```

## 실행 방법

### 1. PostgreSQL 준비

로컬에 PostgreSQL을 띄우거나 원격 인스턴스에 빈 DB(`football_dashboard`)를 생성하세요.

### 2. 환경변수 작성

`.env.example`을 복사해 `.env`를 만든 뒤 값을 채웁니다.

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/football_dashboard?schema=public"
FOOTBALL_DATA_API_TOKEN="your_token_here"
```

토큰은 https://www.football-data.org/client/register 에서 무료로 발급받을 수 있습니다.

### 3. 의존성 설치

```bash
npm install
```

### 4. Prisma 마이그레이트 + 클라이언트 생성

```bash
npm run prisma:migrate    # 최초 1회 (이름 묻는 프롬프트가 나오면 init 등 입력)
npm run prisma:generate   # 클라이언트 재생성이 필요할 때
```

### 5. 외부 API → DB 적재

```bash
npm run refresh:data
```

리그별 경기·순위·득점이 한 번에 upsert 됩니다. 토큰/DB가 비어 있으면 명확한 에러 메시지를 출력하고 종료합니다.

### 6. 대시보드 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 으로 접속하면 `/main` 으로 리다이렉트되며 4분할 대시보드를 확인할 수 있습니다.

## 보조 도구

- `npm run prisma:studio` — Prisma Studio로 DB 데이터 확인
- `POST /api/tasks/refresh?league=PL` — 운영 중 특정 리그만 즉시 새로고침
- `ENABLE_REFRESH_SCHEDULER=true` (env) — 서버가 떠 있는 동안 15분마다 자동 갱신

## 포트폴리오 강조점

- **외부 API 데이터 수집**: Football-data.org v4의 matches·standings·scorers 엔드포인트를 시즌 범위 단위로 호출
- **데이터 정제 및 적재**: 응답을 모델 친화적인 평면 구조로 변환(`transform.js`)하고 null·결측치를 일관 처리
- **중복 방지를 위한 upsert**: `apiMatchId`, `(leagueCode, season, teamId)` 등 비즈니스 키 기반 unique 제약 + Prisma `upsert`로 멱등성 보장
- **상태값 기반 분류**: `Match.status` 한 컬럼으로 예정/진행/종료를 구분하고, 화면은 status enum 집합을 통해 분리 조회
- **운영 친화적 에러 메시지**: 토큰 누락, 리그 코드 오타, 외부 API 4xx/5xx 시 어떤 리그·어떤 URL에서 실패했는지 즉시 식별 가능
- **평면 DB ↔ 중첩 UI 모델 분리**: 저장 모델은 분석/조회 친화적인 평면, 화면 컴포넌트는 기존 중첩 구조를 유지 — 조회 레이어에서만 변환
