-- ============================================================
-- Seed Demo Data for Public Demo Page
-- ============================================================
-- This creates publicly accessible demo workflows (no authentication required)
-- These workflows have is_demo = true and can be displayed on /demo page

DO $$
BEGIN
  -- Clean up existing demo data (optional)
  DELETE FROM work_analysis_steps WHERE workflow_id IN (
    SELECT workflow_id FROM work_workflows WHERE is_demo = true
  );
  DELETE FROM work_workflows WHERE is_demo = true;
  DELETE FROM work_videos WHERE title LIKE '%[DEMO]%';

  RAISE NOTICE 'Creating demo workflows...';

  -- Create demo videos (owner_id can be NULL for public demos)
  INSERT INTO work_videos (
    owner_id,
    title,
    original_filename,
    mime_type,
    file_size,
    storage_path,
    thumbnail_url,
    duration_seconds,
    status,
    progress,
    requested_at,
    completed_at
  ) VALUES 
  (
    NULL,
    '[DEMO] 고객 주문 처리 프로세스',
    'demo-order-process.mp4',
    'video/mp4',
    15728640,
    'demo/order-process.mp4',
    '/placeholder-video.jpg',
    323,
    'completed',
    100,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    NULL,
    '[DEMO] 회원 가입 승인 절차',
    'demo-member-approval.mp4',
    'video/mp4',
    12582912,
    'demo/member-approval.mp4',
    '/placeholder-video.jpg',
    225,
    'completed',
    100,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  ),
  (
    NULL,
    '[DEMO] 재고 입고 처리',
    'demo-inventory-process.mp4',
    'video/mp4',
    18874368,
    'demo/inventory-process.mp4',
    '/placeholder-video.jpg',
    252,
    'processing',
    45,
    NOW() - INTERVAL '1 day',
    NULL
  );

  -- Create demo workflows (is_demo = true)
  INSERT INTO work_workflows (
    owner_id,
    title,
    description,
    source_video_id,
    duration_seconds,
    thumbnail_url,
    status,
    is_demo,
    requested_at,
    completed_at
  ) VALUES
  (
    NULL,
    '고객 주문 처리 프로세스',
    'AI로 분석된 주문 처리 업무 플로우 - 데모용 샘플',
    (SELECT video_id FROM work_videos WHERE title = '[DEMO] 고객 주문 처리 프로세스' LIMIT 1),
    323,
    '/placeholder-video.jpg',
    'analyzed',
    true,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    NULL,
    '회원 가입 승인 절차',
    'AI로 분석된 회원 승인 업무 플로우 - 데모용 샘플',
    (SELECT video_id FROM work_videos WHERE title = '[DEMO] 회원 가입 승인 절차' LIMIT 1),
    225,
    '/placeholder-video.jpg',
    'analyzed',
    true,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  ),
  (
    NULL,
    '재고 입고 처리',
    'AI 분석 진행 중 - 데모용 샘플',
    (SELECT video_id FROM work_videos WHERE title = '[DEMO] 재고 입고 처리' LIMIT 1),
    252,
    '/placeholder-video.jpg',
    'analyzing',
    true,
    NOW() - INTERVAL '1 day',
    NULL
  );

  -- Create analysis steps for demo workflow 1 (주문 처리)
  INSERT INTO work_analysis_steps (
    workflow_id,
    sequence_no,
    type,
    action,
    description,
    timestamp_label,
    timestamp_seconds,
    confidence
  ) VALUES
  ((SELECT workflow_id FROM work_workflows WHERE title = '고객 주문 처리 프로세스' AND is_demo = true LIMIT 1),
   1, 'navigate', '주문 목록 페이지 접속', '관리자 대시보드에서 주문 관리 메뉴 클릭', '00:15', 15, 98),
  ((SELECT workflow_id FROM work_workflows WHERE title = '고객 주문 처리 프로세스' AND is_demo = true LIMIT 1),
   2, 'click', '신규 주문 필터 적용', '상태 필터에서 ''신규 주문'' 선택', '00:32', 32, 95),
  ((SELECT workflow_id FROM work_workflows WHERE title = '고객 주문 처리 프로세스' AND is_demo = true LIMIT 1),
   3, 'click', '주문 상세 정보 확인', '첫 번째 주문 항목 클릭하여 상세 페이지 진입', '00:45', 45, 97),
  ((SELECT workflow_id FROM work_workflows WHERE title = '고객 주문 처리 프로세스' AND is_demo = true LIMIT 1),
   4, 'wait', '재고 확인', '주문 상품의 재고 수량 확인', '01:12', 72, 92),
  ((SELECT workflow_id FROM work_workflows WHERE title = '고객 주문 처리 프로세스' AND is_demo = true LIMIT 1),
   5, 'decision', '재고 충분 여부 판단', '재고가 충분한 경우 승인, 부족한 경우 대기', '01:25', 85, 89),
  ((SELECT workflow_id FROM work_workflows WHERE title = '고객 주문 처리 프로세스' AND is_demo = true LIMIT 1),
   6, 'click', '주문 승인 처리', '''주문 승인'' 버튼 클릭', '01:38', 98, 96),
  ((SELECT workflow_id FROM work_workflows WHERE title = '고객 주문 처리 프로세스' AND is_demo = true LIMIT 1),
   7, 'input', '배송 정보 입력', '택배사 선택 및 송장번호 입력', '02:05', 125, 94),
  ((SELECT workflow_id FROM work_workflows WHERE title = '고객 주문 처리 프로세스' AND is_demo = true LIMIT 1),
   8, 'click', '고객 알림 발송', '주문 승인 및 배송 시작 알림 전송', '02:30', 150, 91);

  -- Create analysis steps for demo workflow 2 (회원 승인)
  INSERT INTO work_analysis_steps (
    workflow_id,
    sequence_no,
    type,
    action,
    description,
    timestamp_label,
    timestamp_seconds,
    confidence
  ) VALUES
  ((SELECT workflow_id FROM work_workflows WHERE title = '회원 가입 승인 절차' AND is_demo = true LIMIT 1),
   1, 'navigate', '회원 관리 페이지 접속', '사이드바에서 회원 관리 메뉴 선택', '00:08', 8, 99),
  ((SELECT workflow_id FROM work_workflows WHERE title = '회원 가입 승인 절차' AND is_demo = true LIMIT 1),
   2, 'click', '승인 대기 필터 적용', '상태 필터에서 ''승인 대기'' 선택', '00:20', 20, 96),
  ((SELECT workflow_id FROM work_workflows WHERE title = '회원 가입 승인 절차' AND is_demo = true LIMIT 1),
   3, 'wait', '회원 정보 검토', '신청자의 이름, 이메일, 사업자 정보 확인', '00:35', 35, 93),
  ((SELECT workflow_id FROM work_workflows WHERE title = '회원 가입 승인 절차' AND is_demo = true LIMIT 1),
   4, 'decision', '승인 여부 결정', '정보가 정확하면 승인, 의심스러우면 거부', '01:15', 75, 87),
  ((SELECT workflow_id FROM work_workflows WHERE title = '회원 가입 승인 절차' AND is_demo = true LIMIT 1),
   5, 'click', '승인 처리', '''승인'' 버튼 클릭하여 회원 활성화', '01:28', 88, 98);

  RAISE NOTICE 'Demo data created successfully!';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating demo data: %', SQLERRM;
    RAISE;
END $$;
