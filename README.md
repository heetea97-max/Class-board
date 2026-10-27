# 우리반 보드 (Netlify용 패들렛형 파일 공유 사이트)

학생은 링크(또는 QR)만 열면 **계정 없이** 이름·글·파일을 올릴 수 있고,
교사는 비밀번호로 보드를 만들고, 마감하고, 글을 지울 수 있습니다.

## 기능
- 보드 여러 개 만들기 (반별·과제별 주소: `사이트주소/?b=2-3-science`)
- 사진·영상은 카드에 바로 보이고, PDF·한글·워드 등은 눌러서 열기/받기
- 휴대폰 사진은 올리기 전에 자동으로 줄여서 업로드 (파일당 5MB까지)
- 링크 복사 + QR 코드로 공유
- 교사 모드: 제출 마감/재개, 글 삭제, 보드 통째로 삭제
- 15초마다 새 글 자동 반영

## 배포 방법

> ⚠️ Netlify 사이트에 폴더를 끌어다 놓는 방식(Netlify Drop)은 서버 함수가 돌지 않아 **업로드가 안 됩니다.**
> 아래 두 방법 중 하나로 올려 주세요.

### 방법 A. GitHub 연결 (추천)
1. 이 폴더를 GitHub 저장소로 올립니다.
2. Netlify → **Add new site → Import an existing project** → 저장소 선택.
   빌드 설정은 `netlify.toml`에 들어 있어서 그대로 두면 됩니다.
3. 아래 **교사 비밀번호 설정**을 하고 다시 배포(Deploys → Trigger deploy).

### 방법 B. Netlify CLI
```bash
npm install -g netlify-cli
cd class-board
npm install
netlify login
netlify init        # 새 사이트 만들기
netlify env:set ADMIN_PASSWORD "원하는비밀번호"
netlify deploy --prod
```

### 교사 비밀번호 설정 (필수)
Netlify 사이트 → **Site configuration → Environment variables** →
`ADMIN_PASSWORD` 라는 이름으로 비밀번호를 추가하고 다시 배포하세요.
설정하지 않으면 아무도 교사 모드에 들어갈 수 없습니다.

## 사용 순서
1. 사이트 첫 화면에서 **교사 비밀번호 입력** → 보드 제목·주소 입력 → 새 보드 만들기
2. 보드 화면 오른쪽 위 **공유** → QR을 화면에 띄우거나 링크를 학급 채팅방에 공유
3. 학생은 오른쪽 아래 **+** 버튼으로 올리기
4. 다 받았으면 **제출 마감**

## 알아 두실 점
- 링크를 아는 사람은 누구나 올리고 볼 수 있습니다. 보드 주소를 너무 쉽게 짓지 말고(예: `2-3-sci-k7q`), 수업이 끝난 보드는 삭제하세요.
- 학생 이름은 학생이 직접 적는 값이라 본인 확인은 되지 않습니다. 실명 대신 번호만 쓰게 해도 됩니다.
- 파일은 Netlify Blobs에 저장되며, 사용량은 Netlify 대시보드에서 확인할 수 있습니다.
- 한 파일 5MB 제한은 Netlify 함수 요청 크기 한도 때문입니다. 큰 영상은 유튜브/드라이브 링크를 글에 붙이도록 안내하세요.

## 폴더 구조
```
public/index.html               화면 전체
public/qrcode.js                QR 코드 생성 (MIT, Kazuhiko Arase)
netlify/functions/boards.mjs    보드 만들기·조회·마감·삭제
netlify/functions/posts.mjs     글 올리기·목록·삭제
netlify/functions/file.mjs      파일 보기/받기
netlify/lib/common.mjs          공통 함수
```
