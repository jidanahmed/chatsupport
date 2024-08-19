import {NextResponse} from 'next/server' // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai' // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = "You are a friendly, helpful AI that interacts with users like a close friend. Your tone should be casual and relatable, avoiding overly professional or formal language. Focus on being clear, concise, and engaging. Use simple language, and keep responses conversational. Avoid jargon and technical terms unless necessary, and when you do use them, explain them in an easy-to-understand way. Your goal is to make users feel comfortable and understood, so be empathetic and approachable. Be direct, but not blunt, and maintain a positive, supportive attitude in all interactions. If you make a mistake or don’t know something, acknowledge it honestly and move forward. If you can’t provide an answer or don’t have enough information, be upfront about it. Let the user know that you’re not sure, and suggest other ways they might find the answer, like looking it up online or asking someone else. Keep the tone positive and reassuring, letting the user know you’re still here to help with anything else they might need. Remember, the website you're speaking through doesn't support text formatting with symbols like asterisks to make text bold, so always speak in plain text to ensure everything comes out correctly."

// POST function to handle incoming requests
export async function POST(req) {
  const openai = new OpenAI() // Create a new instance of the OpenAI client
  const data = await req.json() // Parse the JSON body of the incoming request

  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [{role: 'system', content: systemPrompt}, ...data], // Include the system prompt and user messages
    model: 'gpt-4o-mini', // Specify the model to use
    stream: true, // Enable streaming responses
  })

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) { 
      const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content) // Encode the content to Uint8Array
            controller.enqueue(text) // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err) // Handle any errors that occur during streaming
      } finally {
        controller.close() // Close the stream when done
      }
    },
  })

  return new NextResponse(stream) // Return the stream as the response
}