import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', type: 'text', content: "Hello! I'm your Concept Simplifier. What complex topic can I help you understand today?" }
  ]);
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  const messagesEndRef = useRef(null);
  const logsEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStep]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleSend = () => {
    if (!input.trim() || isSimplifying) return;

    const userMessage = { role: 'user', type: 'text', content: input };
    const conceptInput = input;

    // Find the last explanation and the original concept it was based on
    const lastAsstMsg = [...messages].reverse().find(m => m.role === 'assistant' && m.type === 'explanation');
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user' && m.type === 'text');

    const isFollowUp = !!lastAsstMsg;
    const targetConcept = isFollowUp ? lastUserMsg.content : conceptInput;
    const userFeedback = isFollowUp ? conceptInput : null;
    const lastExplanation = lastAsstMsg ? lastAsstMsg.content : null;

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSimplifying(true);
    setLogs([]);
    setCurrentStep({ role: 'System', step: isFollowUp ? 'Refining based on your feedback...' : 'Initializing Agent...' });

    const url = new URL('http://localhost:3001/simplify');
    url.searchParams.append('concept', targetConcept);
    if (userFeedback) url.searchParams.append('feedback', userFeedback);
    if (lastExplanation) url.searchParams.append('lastExplanation', lastExplanation);

    const eventSource = new EventSource(url.toString());

    let lastExplanationReceived = '';
    let iterations = 0;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLogs((prev) => [...prev, data]);

      if (data.type === 'done') {
        eventSource.close();
        setIsSimplifying(false);
        setCurrentStep(null);
        // Add final explanation as a message if not already there
        setMessages((prev) => [...prev, {
          role: 'assistant',
          type: 'explanation',
          content: lastExplanationReceived,
          iterations: iterations
        }]);
      } else if (data.type === 'error') {
        setMessages((prev) => [...prev, { role: 'assistant', type: 'error', content: data.message }]);
        eventSource.close();
        setIsSimplifying(false);
        setCurrentStep(null);
      } else if (data.type === 'thinking') {
        setCurrentStep({ role: data.role, step: data.step });
      } else if (data.type === 'explanation') {
        lastExplanationReceived = data.content;
        iterations = data.iteration;
      } else if (data.type === 'stop') {
        setCurrentStep({ role: 'System', step: data.reason });
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setIsSimplifying(false);
      setCurrentStep(null);
      setMessages((prev) => [...prev, { role: 'assistant', type: 'error', content: 'Connection to agent lost.' }]);
    };
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h1>Concept Simplifier</h1>
        <button className="log-toggle-btn" onClick={() => setShowLogs(!showLogs)}>
          {showLogs ? 'Hide Logs' : 'Show Logs'}
        </button>
      </header>

      <div className="messages-list">
        {messages.map((msg, index) => (
          <div key={index} className={`message-wrapper ${msg.role}`}>
            <div className={`message-bubble ${msg.type}`}>
              {msg.type === 'text' && <p>{msg.content}</p>}
              {msg.type === 'explanation' && (
                <div className="explanation-msg">
                  <div className="explanation-meta">Refined {msg.iterations} times</div>
                  {msg.content.split('\n').map((para, i) => para ? <p key={i}>{para}</p> : <br key={i} />)}
                </div>
              )}
              {msg.type === 'error' && <p className="error-text">{msg.content}</p>}
            </div>
          </div>
        ))}

        {isSimplifying && currentStep && (
          <div className="message-wrapper assistant">
            <div className="message-bubble thinking">
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
              <div className="thinking-info">
                <strong>{currentStep.role}</strong>: {currentStep.step}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showLogs && (
        <div className="floating-logs">
          <div className="logs-header">
            <h3>Agent Processing Logs</h3>
            <button onClick={() => setShowLogs(false)}>×</button>
          </div>
          <div className="logs-content">
            {logs.map((log, index) => (
              <div key={index} className={`log-entry ${log.type}`}>
                {log.type === 'thinking' && <span>[{log.role}] {log.step}</span>}
                {log.type === 'feedback' && <span>Critic: {log.score}/10 - {log.issues.join(', ')}</span>}
                {log.type === 'stop' && <span>System: {log.reason}</span>}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      <div className="input-area">
        <div className="input-box">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a complex concept..."
            disabled={isSimplifying}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            autoFocus
          />
          <button onClick={handleSend} disabled={isSimplifying || !input.trim()}>
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
