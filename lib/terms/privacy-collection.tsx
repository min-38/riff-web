export default function PrivacyCollectionContent() {
  return (
    <div className="prose dark:prose-invert text-sm space-y-4">
      <h3 className="text-lg font-semibold">1. 수집하는 개인정보 항목</h3>
      <p>Riff는 회원가입 및 계정 관리를 위해 다음과 같은 개인정보를 수집합니다:</p>
      <div className="ml-4">
        <p><strong>필수항목:</strong></p>
        <ul className="list-disc ml-6">
          <li>이메일 주소</li>
          <li>비밀번호 (암호화 저장)</li>
          <li>닉네임</li>
        </ul>
      </div>

      <h3 className="text-lg font-semibold">2. 개인정보의 수집 및 이용 목적</h3>
      <p>수집된 개인정보는 다음의 목적으로만 이용됩니다:</p>
      <div className="ml-4">
        <ul className="list-disc ml-6">
          <li><strong>회원 가입 및 관리:</strong> 회원제 서비스 이용을 위한 본인 확인, 회원 식별</li>
          <li><strong>본인 인증:</strong> 이메일 인증을 통한 본인 확인 절차</li>
          <li><strong>부정 이용 방지:</strong> 비정상적 이용 및 부정 거래 방지</li>
          <li><strong>서비스 제공:</strong> 로그인, 재생목록 저장 등 회원 전용 서비스 제공</li>
        </ul>
      </div>

      <h3 className="text-lg font-semibold">3. 개인정보의 보유 및 이용 기간</h3>
      <p>회원 탈퇴 시까지 보유하며, 탈퇴 즉시 지체 없이 파기합니다.</p>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        단, 관련 법령에 따라 보존할 필요가 있는 경우 해당 법령에서 정한 기간 동안 보관합니다:
      </p>
      <div className="ml-4 text-sm">
        <ul className="list-disc ml-6">
          <li>부정 이용 기록: 1년 (전자상거래법)</li>
        </ul>
      </div>

      <h3 className="text-lg font-semibold">4. 동의 거부 권리 및 거부 시 불이익</h3>
      <p>위 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다.</p>
      <p className="text-red-600 dark:text-red-400">
        다만, 필수 항목 동의를 거부하시는 경우 회원가입이 제한됩니다.
      </p>
    </div>
  );
}
