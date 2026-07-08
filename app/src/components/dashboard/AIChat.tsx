import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestedPrompts = [
  "Analyze my recent performance",
  "What are my best trading hours?",
  "Suggest risk parameters",
];

export default function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm your AI trading assistant. I can analyze your performance, suggest strategies, and help you journal your trades. What would you like to explore?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses: Record<string, string> = {
        "Analyze my recent performance":
          "Based on your last 20 trades, your win rate is 62.5% with an average R:R of 1.8:1. Your best performing setup is trend continuation on the 1H timeframe. Consider reducing position size during high-volatility periods.",
        "What are my best trading hours?":
          "Your optimal trading window is 9:30-11:00 AM EST (NYSE open). You achieve a 71% win rate during this period compared to 48% in the afternoon session. The London-NY overlap shows your highest average profit per trade.",
        "Suggest risk parameters":
          "Given your current account size and drawdown tolerance, I recommend: Max risk per trade = 1.5%, Daily loss limit = 3%, Max concurrent positions = 3. Your Kelly criterion optimal fraction is 0.042 (4.2%).",
      };

      const replyContent =
        responses[input.trim()] ||
        "I understand you're asking about " +
          input.trim().slice(0, 30) +
          "... As your trading data grows, I'll be able to provide more specific insights. Keep logging your trades to unlock deeper analytics.";

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: replyContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#18181b] border border-[#27272a] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#27272a] shrink-0">
        <div className="w-5 h-5 rounded-md bg-[#3b82f6]/20 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-[#3b82f6]" />
        </div>
        <span className="text-white text-sm font-medium">AI Assistant</span>
        <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] ml-auto" />
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                  msg.role === "assistant"
                    ? "bg-[#3b82f6]/20"
                    : "bg-[#27272a]"
                }`}
              >
                {msg.role === "assistant" ? (
                  <Sparkles className="w-3 h-3 text-[#3b82f6]" />
                ) : (
                  <User className="w-3 h-3 text-[#a1a1aa]" />
                )}
              </div>
              <div
                className={`max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed ${
                  msg.role === "assistant"
                    ? "bg-[#27272a] text-[#d4d4d8]"
                    : "bg-[#3b82f6]/20 text-white border border-[#3b82f6]/30"
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2.5"
          >
            <div className="w-6 h-6 rounded-md bg-[#3b82f6]/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-3 h-3 text-[#3b82f6]" />
            </div>
            <div className="bg-[#27272a] px-3 py-2 rounded-lg">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#52525b] animate-bounce" />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#52525b] animate-bounce"
                  style={{ animationDelay: "0.15s" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#52525b] animate-bounce"
                  style={{ animationDelay: "0.3s" }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Suggested prompts */}
        {messages.length === 1 && !isTyping && (
          <div className="flex flex-wrap gap-2 pt-2">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => {
                  setInput(prompt);
                }}
                className="text-[10px] px-2.5 py-1.5 rounded-md bg-[#27272a] text-[#a1a1aa] hover:text-white hover:bg-[#3f3f46] transition-colors border border-[#3f3f46]/50"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-[#27272a] shrink-0">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Type a command..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 h-8 bg-[#27272a] border-[#3f3f46] text-white text-xs placeholder:text-[#52525b] focus-visible:ring-[#3b82f6]/30 focus-visible:border-[#3b82f6]/50"
          />
          <Button
            size="sm"
            className="h-8 w-8 p-0 bg-[#3b82f6] hover:bg-[#2563eb]"
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
