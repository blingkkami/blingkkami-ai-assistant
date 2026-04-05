import { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2, Sparkles, FileText, AlertCircle, ChevronDown, ChevronUp, Copy, Check, Download, Upload, X, ArrowRight } from 'lucide-react';
import { cn } from './lib/utils';
import { avatarBase64, logoBase64 } from './assets/images';

const avatarImg = avatarBase64;
const logoImg = logoBase64;

const CATEGORIES = [
  '선택해주세요',
  '화장품/뷰티',
  '건강기능식품/식품',
  '패션/잡화',
  '가전/디지털',
  '생활용품/리빙',
  '기타 (일반 제품)'
];

const SALES_CHANNELS = [
  '선택해주세요',
  '스마트스토어',
  '쿠팡',
  '자사몰',
  '와디즈/크라우드펀딩',
  '기타'
];

function CollapsibleSection({ title, content }: { title: string, content: string }) {
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-purple-900/30 rounded-lg mb-4 overflow-hidden bg-zinc-900">
      <div 
        className="flex items-center justify-between p-4 bg-zinc-800 cursor-pointer hover:bg-zinc-700 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-bold text-purple-100 m-0">{title}</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            className="p-2 text-zinc-400 hover:text-purple-300 hover:bg-purple-900/30 rounded-md transition-colors flex items-center gap-1 text-sm"
            title="섹션 복사하기"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            <span className="hidden sm:inline">{copied ? '복사됨' : '복사'}</span>
          </button>
          {isOpen ? <ChevronUp className="w-5 h-5 text-purple-400" /> : <ChevronDown className="w-5 h-5 text-purple-400" />}
        </div>
      </div>
      {isOpen && (
        <div className="p-6 border-t border-purple-900/30 prose prose-invert prose-purple max-w-none prose-p:text-zinc-300 prose-li:text-zinc-300 prose-strong:text-purple-200">
          <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [showCover, setShowCover] = useState(true);
  const [mode, setMode] = useState('기본 모드');
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [salesChannel, setSalesChannel] = useState(SALES_CHANNELS[0]);
  const [priceRange, setPriceRange] = useState('');
  const [keyFeatures, setKeyFeatures] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [usp, setUsp] = useState('');
  const [toneAndManner, setToneAndManner] = useState('');
  const [hasExistingProposal, setHasExistingProposal] = useState(false);
  const [existingProposal, setExistingProposal] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<{data: string, mimeType: string, name: string}[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyAll = () => {
    navigator.clipboard.writeText(result);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeProductName = productName.replace(/[^a-zA-Z0-9가-힣]/g, '_') || '상세페이지';
    link.download = `${safeProductName}_기획안.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        reader.onload = (event) => {
          const base64 = (event.target?.result as string).split(',')[1];
          setAttachedFiles(prev => [...prev, { data: base64, mimeType: file.type, name: file.name }]);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = (event) => {
          const text = event.target?.result as string;
          setExistingProposal(prev => prev ? prev + '\n\n' + text : text);
        };
        reader.readAsText(file);
      }
    });
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const generatePlan = async () => {
    if (!productName || !keyFeatures) {
      setError('제품명과 핵심 성분/특장점은 필수 입력 항목입니다.');
      return;
    }
    if (category === CATEGORIES[0]) {
      setError('카테고리를 선택해주세요.');
      return;
    }
    if (mode === '수정 모드' && (!hasExistingProposal || (!existingProposal.trim() && attachedFiles.length === 0))) {
      setError('수정 모드에서는 기존 기획안/상세페이지 내용(텍스트 또는 첨부파일)을 반드시 입력해야 합니다.');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');

    let modeDescription = '';
    let outputStructure = '';

    if (mode === '기본 모드') {
      modeDescription = '기본 모드: 고객에게 바로 제안할 수 있는 수준의 설득형 기획안 작성 (상세페이지 본문을 15~18개 섹션으로 풍부하게 구성하는 풀버전). 무드(감성) 60% + 정보(이성/팩트) 40%의 밸런스를 유지하여 구매 전환율을 극대화. 인트로는 짧게, 핵심 USP는 2~3개로 강하게 어필하고, 정보성 내용(사용법, FAQ 등)은 후반부에 깔끔하게 정리형으로 배치.';
      outputStructure = `## [기본 모드] 상세페이지 풀버전 기획안
## 1. 3줄 요약 (클라이언트 전달용)
- 타겟, USP, 톤앤매너를 한 줄씩 정리하여 이 페이지의 전체적인 느낌을 먼저 보여주세요.
## 2. 한 줄 제품 진단 및 타겟 페르소나
## 3. 기획 방향성 및 브랜딩 요약
## 4. 상세페이지 전체 섹션 구성안 (15~18개 섹션 풀버전)
- 실제 디자인 시 "핵심 문장만 살려 쓰겠다"는 전제를 클라이언트에게 안내하는 문구를 포함하세요.
## 5. 섹션별 카피라이팅 초안 (도입부 - 문제제기 - 해결책/USP 1,2,3 - 디테일/성분 - 브랜드 스토리 - 신뢰도/리뷰 - 사용법 - FAQ - 아웃트로 등 15~18개 섹션을 상세하게 작성)
## 6. 이미지 및 시각화 디렉팅 가이드
## 7. 광고법 및 규제 검토
## 8. 레퍼런스 방향성
## 9. SEO / 키워드 전략`;
    } else if (mode === '간단 모드') {
      modeDescription = '간단 모드: 기본 모드의 품질과 설득력은 유지하되, 각 섹션에 들어가는 "텍스트 양(카피 밀도)"을 대폭 줄여 모바일 가독성을 극대화한 라이트 버전. (섹션 수는 9~15개로 유지하되, 문장을 짧고 직관적으로 압축할 것).';
      outputStructure = `## [간단 모드] 텍스트 압축형 기획안
## 1. 3줄 요약 (클라이언트 전달용)
- 타겟, USP, 톤앤매너를 한 줄씩 정리하여 이 페이지의 전체적인 느낌을 먼저 보여주세요.
## 2. 핵심 기획 방향성
## 3. 섹션 구성안 (9~15개 섹션)
- 실제 디자인 시 "핵심 문장만 살려 쓰겠다"는 전제를 클라이언트에게 안내하는 문구를 포함하세요.
## 4. 섹션별 카피라이팅 초안 (섹션 수는 9~15개로 구성하되, 각 섹션별 텍스트 양을 최소화하고 핵심 문장 위주로 매우 간결하게 작성)
## 5. 핵심 이미지 디렉팅 가이드
## 6. 광고법 검토 요약`;
    } else {
      modeDescription = '수정 모드: 기존 기획안/상세페이지를 분석하여 리뉴얼 방향을 제안. 기존의 문제점을 짚고, 전환율을 높이기 위해 어떻게 바뀌어야 하는지 Before/After를 명확히 제시하되, 수정을 제안할 때는 반드시 타당하고 명확한 근거(UX, 마케팅 심리, 가독성, 타겟 핏 등)를 함께 제시하세요. 단, 기존 내용이 이미 충분히 훌륭하다면 억지로 수정하지 말고 "유지"를 권장하며 그 이유를 설명하세요.';
      outputStructure = `## [수정 모드] 리뉴얼 기획안
## 1. 3줄 요약 (클라이언트 전달용)
- 타겟, USP, 톤앤매너를 한 줄씩 정리하여 이 페이지의 전체적인 느낌을 먼저 보여주세요.
## 2. 기존 기획안 진단 및 문제점 분석
- 기존 기획안의 장점도 함께 언급하고, 억지로 수정할 필요가 없는 부분은 명확히 짚어주세요.
## 3. 리뉴얼 기획 방향성 및 기대 효과
## 4. 리뉴얼 섹션 구성안 및 수정 제안
- 유지/수정/삭제/추가할 각 섹션에 대해 **명확하고 논리적인 근거(UX, 마케팅 심리, 가독성 등)**를 반드시 상세히 명시하세요. (수정할 필요가 없는 섹션은 '유지'로 분류하고 그 이유를 적으세요.)
- 실제 디자인 시 "핵심 문장만 살려 쓰겠다"는 전제를 클라이언트에게 안내하는 문구를 포함하세요.
## 5. 섹션별 카피라이팅 초안 (Before & After 비교 및 수정/유지 근거 포함)
## 6. 개선된 이미지 디렉팅 가이드
## 7. 광고법 및 규제 검토`;
    }

    const prompt = `당신은 한국 이커머스 상세페이지 전문 기획 어시스턴트입니다.

당신의 역할은 사용자가 입력한 제품 정보를 바탕으로,
고객에게 바로 제안할 수 있는 수준의 상세페이지 기획안과 카피라이팅 초안을 작성하는 것입니다.

이 결과물은 단순 아이디어 메모가 아니라,
상세페이지 디자이너가 고객에게 유료로 제안하거나 실제 제작에 바로 사용할 수 있는 수준이어야 합니다.

[최우선 목표]
- 구매전환률을 높이는 상세페이지 구조를 설계할 것
- 고객에게 "이렇게 만들겠습니다"라고 바로 설명할 수 있을 정도의 설득력을 가질 것
- 디자이너가 바로 작업에 들어갈 수 있을 정도로 구체적일 것
- 카테고리별 광고 리스크를 사전에 검토할 것

[사용 모드]
${modeDescription}

[제품 정보]
- 제품명: ${productName}
- 카테고리: ${category}
- 판매 채널: ${salesChannel !== SALES_CHANNELS[0] ? salesChannel : '미정'}
- 가격대 및 포지셔닝: ${priceRange || '미정'}
- 핵심 성분/특장점: ${keyFeatures}
- 타겟 고객: ${targetAudience || '미정 (제품 정보를 바탕으로 타겟 고객을 추천해주세요)'}
- 경쟁사 대비 USP: ${usp || '미정'}
- 톤앤매너: ${toneAndManner || '미정'}
${hasExistingProposal ? `- 기존 기획안/내용 요약: ${existingProposal}` : ''}

[작성 원칙]
- 지나치게 문학적이고 시적인 표현은 지양하고, 고객이 제품의 특성(향, 맛, 기능 등)을 직관적으로 "바로 이해할 수 있도록" 명확하게 작성하세요.
- 카피 밀도를 낮추고 핵심 문장 위주로 강하게 타격감을 주세요. 모바일 스크롤 피로도를 줄이기 위해 서브 카피는 최대한 간결하게 작성하고, 필요한 경우 줄바꿈/하이라이트 처리를 제안하세요.
- 향수 노트, 제형, 구조 등 복잡한 설명은 텍스트를 줄이고 '이미지/다이어그램 시각화 위주'로 디렉팅하세요.
- 각 섹션의 구조, 카피, 이미지 방향에 대한 타당한 이유를 제시하세요.
- 첫 3개 섹션 내에 핵심 가치, 구매 이유, 차별점이 드러나게 하세요.
- 클라이언트 확인이 필요한 수치(가격, 지속시간, 성분 개수 등)나 팩트(향 노트, 원산지 등)는 임의로 확정하지 말고 반드시 붉은색/형광펜 표시(마크다운 하이라이트 \`==내용==\` 또는 **굵게**)를 하여 "확정 필요"임을 명시하세요.
- 디자이너 내부 참고용 문장이나 기획 의도는 회색 메모(마크다운 인용구 \`> 내용\`)로 처리하여 실제 노출되는 카피와 구분하세요.
- 브랜드 아이덴티티와 네이밍의 톤앤매너 정합성에 대한 체크 포인트를 포함하세요.

[광고법 및 규제 검토 원칙]
- 화장품: 화장품법 제13조 기준 (의약품 오인 우려, 기능성 오인 등 주의)
- 건강기능식품: 기능성 표시/광고 심의 기준
- 일반 제품: 허위/과대 광고 및 소비자 기만 우려 검토
- 표현 분류: [표현 가능] / [주의 요망] / [검토 필요] 로 나누어 제시하고, 대체 표현을 제안하세요.

[출력 구조]
반드시 아래의 구조를 마크다운 헤딩(##)으로 구분하여 작성해주세요. 각 헤딩은 정확히 아래의 이름을 사용해야 합니다.

${outputStructure}

위 정보를 바탕으로 상세페이지 기획안을 작성해주세요.`;

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, attachedFiles }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '기획안 생성 실패');

      setResult(data.text);
    } catch (err: any) {
      console.error("API Error:", err);
      setError(`[오류] ${err.message || '기획안을 생성하는 중 오류가 발생했습니다.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Parse result into sections
  const sections: { title: string, content: string }[] = [];
  if (result) {
    const parts = result.split(/(?=## \d+\. )/g);
    parts.forEach(part => {
      const match = part.match(/^(## \d+\. [^\n]+)\n([\s\S]*)$/);
      if (match) {
        sections.push({
          title: match[1].replace(/^## /, ''),
          content: match[2].trim()
        });
      } else if (part.trim()) {
        // If it doesn't match the exact heading format but has content, add it as a general section
        if (sections.length === 0) {
          sections.push({ title: '개요', content: part.trim() });
        } else {
          sections[sections.length - 1].content += '\n\n' + part.trim();
        }
      }
    });
  }

  if (showCover) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden font-sans">
        {/* Background Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(147,51,234,0.15)_0,rgba(9,9,11,1)_70%)]" />
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-pink-600/10 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="animate-float">
            <img 
              src={avatarImg} 
              alt="Blingkkami Avatar" 
              className="w-64 sm:w-80 h-auto drop-shadow-[0_0_40px_rgba(168,85,247,0.4)] mb-6" 
            />
          </div>
          
          <img 
            src={logoImg} 
            alt="Blingkkami Logo" 
            className="h-16 sm:h-20 object-contain mb-4 drop-shadow-lg" 
          />
          
          <p className="text-purple-300/80 text-lg sm:text-xl mb-12 tracking-wide font-medium text-center px-4">
            나만의 맞춤형 상세페이지 기획 어시스턴트
          </p>
          
          <button 
            onClick={() => setShowCover(false)}
            className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-full font-bold text-lg transition-all shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] hover:-translate-y-1 flex items-center gap-3 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full" />
            <span className="relative z-10 flex items-center gap-2">
              기획안 작성 시작하기
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>
        
        <div className="absolute bottom-8 text-zinc-600 text-sm font-medium tracking-widest">
          Made by Blingkkami 🎀
        </div>

        <style>{`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
            100% { transform: translateY(0px); }
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-gray-100 font-sans">
      <header className="bg-black border-b border-purple-900/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Blingkkami" className="h-8 object-contain" />
            <div className="hidden sm:block">
              <p className="text-xs text-purple-300/80">상세페이지 기획 AI 어시스턴트</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Input Section */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-zinc-900 p-6 rounded-xl shadow-lg border border-purple-900/30 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 pb-4 border-b border-zinc-800 text-purple-100">
              <FileText className="w-5 h-5 text-purple-500" />
              프로젝트 정보 입력
            </h2>
            
            <div className="space-y-5">
              {/* Usage Mode */}
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">기획 모드 <span className="text-purple-500">*</span></label>
                <div className="grid grid-cols-1 gap-2">
                  {['기본 모드', '간단 모드', '수정 모드'].map((m) => (
                    <label key={m} className={cn(
                      "cursor-pointer border rounded-lg p-3 flex items-center gap-3 transition-colors",
                      mode === m ? "border-purple-500 bg-purple-900/20 text-purple-200" : "border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                    )}>
                      <input 
                        type="radio" 
                        name="mode" 
                        value={m} 
                        checked={mode === m} 
                        onChange={(e) => {
                          setMode(e.target.value);
                          if (e.target.value === '수정 모드') setHasExistingProposal(true);
                        }}
                        className="w-4 h-4 text-purple-600 border-zinc-600 bg-zinc-800 focus:ring-purple-500 focus:ring-offset-zinc-900"
                      />
                      <div>
                        <div className="font-medium text-sm">{m}</div>
                        <div className="text-xs opacity-70 mt-0.5">
                          {m === '기본 모드' && '풀버전 상세페이지 (15~18 섹션)'}
                          {m === '간단 모드' && '핵심 압축 버전 (9~12 섹션)'}
                          {m === '수정 모드' && '기존 상세페이지 리뉴얼 제안'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">제품명 <span className="text-purple-500">*</span></label>
                <input 
                  type="text" 
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="예: 프리미엄 유기농 양배추즙"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-shadow text-sm placeholder:text-zinc-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-1">카테고리 <span className="text-purple-500">*</span></label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-shadow text-sm"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-1">판매 채널</label>
                  <select 
                    value={salesChannel}
                    onChange={(e) => setSalesChannel(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-shadow text-sm"
                  >
                    {SALES_CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">가격대 및 포지셔닝</label>
                <input 
                  type="text" 
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  placeholder="예: 3만원대, 프리미엄 가성비"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-shadow text-sm placeholder:text-zinc-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">핵심 성분/특장점 <span className="text-purple-500">*</span></label>
                <textarea 
                  value={keyFeatures}
                  onChange={(e) => setKeyFeatures(e.target.value)}
                  placeholder="제품의 주요 성분, 기능, 특장점을 자세히 적어주세요."
                  rows={4}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-shadow resize-none text-sm placeholder:text-zinc-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">타겟 고객</label>
                <textarea 
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="예: 3040 직장인, 위가 자주 쓰린 사람"
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-shadow resize-none text-sm placeholder:text-zinc-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">경쟁사 대비 USP</label>
                <textarea 
                  value={usp}
                  onChange={(e) => setUsp(e.target.value)}
                  placeholder="경쟁 제품과 비교했을 때 우리 제품만의 확실한 차별점"
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-shadow resize-none text-sm placeholder:text-zinc-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">톤앤매너</label>
                <input 
                  type="text" 
                  value={toneAndManner}
                  onChange={(e) => setToneAndManner(e.target.value)}
                  placeholder="예: 신뢰감 있는, 따뜻한, 트렌디한"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-shadow text-sm placeholder:text-zinc-500"
                />
              </div>

              <div className="pt-2 border-t border-zinc-800">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input 
                    type="checkbox" 
                    checked={hasExistingProposal}
                    onChange={(e) => {
                      setHasExistingProposal(e.target.checked);
                      if (e.target.checked && mode !== '수정 모드') {
                        // Optional: could auto-switch or just show hint
                      }
                    }}
                    className="w-4 h-4 text-purple-600 rounded border-zinc-600 bg-zinc-800 focus:ring-purple-500 focus:ring-offset-zinc-900"
                  />
                  <span className="text-sm font-medium text-purple-200">기존 기획안/상세페이지 내용 있음</span>
                </label>
                
                {hasExistingProposal && mode !== '수정 모드' && (
                  <div className="mb-3 p-2 bg-purple-900/20 text-purple-300 text-xs rounded-lg flex items-start gap-1.5 border border-purple-900/50">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p>기존 기획안이 있다면 <strong>'수정 모드'</strong>를 선택하여 리뉴얼 제안을 받아보시는 것을 추천합니다.</p>
                  </div>
                )}
                
                {hasExistingProposal && (
                  <div className="space-y-3">
                    <textarea 
                      value={existingProposal}
                      onChange={(e) => setExistingProposal(e.target.value)}
                      placeholder="기존 상세페이지의 텍스트나 기획안 요약을 입력해주세요. (수정 모드에서는 필수)"
                      rows={4}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-shadow resize-none text-sm placeholder:text-zinc-500"
                    />
                    
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-sm text-sm font-medium text-purple-200 hover:bg-zinc-700 cursor-pointer transition-colors">
                          <Upload className="w-4 h-4 text-purple-400" />
                          파일 첨부 (이미지, PDF, 텍스트)
                          <input 
                            type="file" 
                            multiple
                            accept="image/*,.pdf,.txt,.md,.csv"
                            className="hidden" 
                            onChange={handleFileUpload}
                          />
                        </label>
                        <span className="text-xs text-zinc-500">
                          상세페이지 이미지나 기획안 문서를 첨부할 수 있습니다.
                        </span>
                      </div>
                      
                      {attachedFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {attachedFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-900/30 text-purple-200 rounded-md text-xs border border-purple-800/50">
                              <span className="max-w-[150px] truncate">{file.name}</span>
                              <button 
                                onClick={() => removeFile(idx)}
                                className="p-0.5 hover:bg-purple-800/50 rounded-full transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-900/20 text-red-400 border border-red-900/50 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <button
                onClick={generatePlan}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4 shadow-lg shadow-purple-900/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    기획안 생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    기획안 생성하기
                  </>
                )}
              </button>
              
              <div className="text-center mt-6 pb-2">
                <p className="text-sm font-medium text-purple-400/80 tracking-wide">Made by Blingkkami 🎀</p>
              </div>
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="xl:col-span-8">
          <div className="bg-zinc-900 p-6 sm:p-8 rounded-xl shadow-lg border border-purple-900/30 min-h-[calc(100vh-8rem)]">
            {result ? (
              <div>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
                  <h2 className="text-2xl font-bold text-purple-100">생성된 기획안</h2>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleDownload}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-900/30 hover:bg-purple-800/50 text-purple-300 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed border border-purple-900/50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      {loading ? '생성 중...' : '다운로드 (.md)'}
                    </button>
                    <button 
                      onClick={handleCopyAll}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700"
                    >
                      {copiedAll ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      {copiedAll ? '전체 복사 완료' : '전체 복사'}
                    </button>
                  </div>
                </div>
                
                {sections.length > 0 ? (
                  <div className="space-y-4">
                    {sections.map((section, index) => (
                      <CollapsibleSection key={index} title={section.title} content={section.content} />
                    ))}
                    <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
                      <p className="text-sm font-medium text-purple-400/60">Generated by Blingkkami's AI Assistant 🎀</p>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-invert prose-purple max-w-none">
                    <Markdown remarkPlugins={[remarkGfm]}>{result}</Markdown>
                    <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
                      <p className="text-sm font-medium text-purple-400/60">Generated by Blingkkami's AI Assistant 🎀</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-4 py-32">
                <img src={avatarImg} alt="Blingkkami" className="w-48 h-auto mb-2 drop-shadow-2xl" />
                <h3 className="text-xl font-medium text-purple-300">블링까미가 상세페이지 기획안을 작성해 드릴게요! 💜</h3>
                <p className="text-center text-sm max-w-sm text-zinc-500">
                  좌측 폼에 제품 정보를 상세히 입력할수록<br />
                  더욱 정교하고 설득력 있는 기획안이 생성됩니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #3f3f46;
          border-radius: 20px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: #52525b;
        }
      `}</style>
    </div>
  );
}