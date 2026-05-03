'use client';

import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  Send, Code, Sparkles, Loader2, History, 
  Download, Copy, Trash2, X, ChevronRight, Layout 
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function Home() {
  const [code, setCode] = useState('// Cole seu código aqui para revisão\nfunction exemplo() {\n  console.log("Hello AI!");\n}');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const feedbackRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/review');
      const data = await res.json();
      if (!data.error) setHistory(data);
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
    }
  };

  const handleReview = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setFeedback('');

    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setFeedback(data.feedback);
      fetchHistory(); // Atualiza histórico após nova revisão
    } catch (err) {
      alert('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!feedbackRef.current) return;
    const canvas = await html2canvas(feedbackRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('code-review.pdf');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--background-start)', overflow: 'hidden' }}>
      {/* Sidebar Histórico */}
      <aside style={{ 
        width: showHistory ? '300px' : '0px', 
        transition: 'width 0.3s ease', 
        overflow: 'hidden',
        background: 'rgba(0,0,0,0.4)',
        borderRight: showHistory ? '1px solid var(--glass-border)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10
      }}>
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', whiteSpace: 'nowrap' }}>Histórico</h3>
          <X size={18} cursor="pointer" onClick={() => setShowHistory(false)} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
          {history.map((item, index) => (
            <div 
              key={index} 
              onClick={() => { setCode(item.code); setFeedback(item.feedback); }}
              style={{ 
                padding: '12px', 
                borderRadius: '10px', 
                marginBottom: '10px', 
                background: 'rgba(255,255,255,0.05)', 
                cursor: 'pointer',
                fontSize: '13px',
                border: '1px solid transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-color)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
            >
              <div style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>Revisão #{history.length - index}</div>
              <div style={{ opacity: 0.6, fontSize: '11px' }}>{new Date(item.created_at).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', height: '100vh' }}>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          style={{ position: 'absolute', left: '20px', top: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', padding: '8px', borderRadius: '8px', zIndex: 5 }}
        >
          <Layout size={20} />
        </button>

        <header style={{ textAlign: 'center', padding: '15px 0' }}>
          <h1 style={{ fontSize: '1.8rem' }}>AI Code Reviewer <span style={{ color: 'var(--accent-color)' }}>Pro</span></h1>
        </header>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: feedback ? '1fr 1fr' : '1fr', 
          gap: '20px', 
          flex: 1, 
          padding: '0 20px 20px 20px', 
          overflow: 'hidden' // Garante que a grid não estiche a página
        }}>
          {/* Editor Area */}
          <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '15px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code size={18} color="var(--accent-color)" />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Editor</span>
              </div>
              <button 
                className="btn-primary" 
                onClick={handleReview} 
                disabled={loading}
                style={{ padding: '6px 15px', fontSize: '13px' }}
              >
                {loading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                {loading ? 'Analisando...' : 'Revisar'}
              </button>
            </div>
            
            <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
              <Editor
                height="100%"
                defaultLanguage="javascript"
                theme="vs-dark"
                value={code}
                onChange={setCode}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>
          </section>

          {/* Feedback Area */}
          {feedback && (
            <section className="glass-card animate-in" style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="var(--success-color)" />
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>Análise da IA</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={exportToPDF} title="PDF" style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><Download size={18} /></button>
                  <button onClick={() => navigator.clipboard.writeText(feedback)} title="Copiar" style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><Copy size={18} /></button>
                </div>
              </div>
              
              <div ref={feedbackRef} className="feedback-container" style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: '20px',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={atomDark}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                    h2: ({ children }) => <h2 style={{ fontSize: '1.1rem', marginTop: '15px', marginBottom: '8px', color: 'var(--accent-color)' }}>{children}</h2>,
                    p: ({ children }) => <p style={{ marginBottom: '8px', opacity: 0.9 }}>{children}</p>,
                  }}
                >
                  {feedback}
                </ReactMarkdown>
              </div>
            </section>
          )}
        </div>
      </main>

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        .feedback-container::-webkit-scrollbar { width: 6px; }
        .feedback-container::-webkit-scrollbar-thumb { background: var(--glass-border); border-radius: 10px; }
        .btn-primary { display: flex; align-items: center; gap: 8px; }
      `}</style>
    </div>
  );
}
