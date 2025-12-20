export default function Footer() {
  return (
    <footer className="bg-white dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 mt-auto border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h4 className="text-foreground font-semibold mb-3 text-sm">Riff</h4>
            <p className="text-sm">
              악기 중고 거래 플랫폼
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-foreground font-semibold mb-3 text-sm">바로가기</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/about" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  소개
                </a>
              </li>
              <li>
                <a href="/faq" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  자주 묻는 질문
                </a>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-foreground font-semibold mb-3 text-sm">카테고리</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/category/guitar" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  기타
                </a>
              </li>
              <li>
                <a href="/category/bass" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  베이스
                </a>
              </li>
              <li>
                <a href="/category/drum" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  드럼
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-foreground font-semibold mb-3 text-sm">고객지원</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/contact" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  문의하기
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  이용약관
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  개인정보처리방침
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-center text-sm text-neutral-500">
          <p>&copy; {new Date().getFullYear()} Riff. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
