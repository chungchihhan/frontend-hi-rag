"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage, QueryResultRecord } from "@/types";
import MessageCard from "./MessageCard";
import ResultMessageCard from "./ResultMessageCard";
import { queryChunks } from "@/lib/api";

interface ChatInterfaceProps {
  fileId: string;
}

// Define a new type to represent a conversation entry which can be either a message or result
interface ConversationEntry {
  type: "message" | "result";
  id: string;
  content: ChatMessage | QueryResultRecord[];
  timestamp: Date;
}

export default function ChatInterface({ fileId }: ChatInterfaceProps) {
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Log the file ID we received
  useEffect(() => {
    console.log("ChatInterface received fileId:", fileId);
  }, [fileId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Create user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: input,
      isUser: true,
      timestamp: new Date(),
    };

    // Add user message to conversation
    const userEntry: ConversationEntry = {
      type: "message",
      id: userMessage.id,
      content: userMessage,
      timestamp: userMessage.timestamp,
    };

    setConversation((prev) => [...prev, userEntry]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      // Check if fileId exists before making the API call
      if (!fileId) {
        throw new Error("Missing file ID. Cannot query chunks.");
      }

      console.log("Querying chunks for file ID:", fileId);

      // Query the API
      const response = await queryChunks(fileId, {
        query_text: input,
        n_results: 3, // Default to 3 results
      });

      console.log("Query chunks response:", response);

      // Create an entry for the results
      const resultEntry: ConversationEntry = {
        type: "result",
        id: `result-${Date.now()}`,
        content: response.results,
        timestamp: new Date(),
      };

      // Add results to conversation
      setConversation((prev) => [...prev, resultEntry]);
    } catch (err) {
      // Set the error state
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      console.error("Query chunks error:", errorMessage);
      setError(errorMessage);

      // Create error message
      const errorMessage2: ChatMessage = {
        id: Date.now().toString(),
        content: `Sorry, there was an error: ${errorMessage}`,
        isUser: false,
        timestamp: new Date(),
      };

      // Add error message to conversation
      const errorEntry: ConversationEntry = {
        type: "message",
        id: errorMessage2.id,
        content: errorMessage2,
        timestamp: errorMessage2.timestamp,
      };

      setConversation((prev) => [...prev, errorEntry]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.map((entry) => (
          <div key={entry.id}>
            {entry.type === "message" && (
              <MessageCard message={entry.content as ChatMessage} />
            )}
            {entry.type === "result" && (
              <div className="flex justify-start">
                <ResultMessageCard
                  results={entry.content as QueryResultRecord[]}
                />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your query here..."
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-300"
            disabled={isLoading || !input.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
