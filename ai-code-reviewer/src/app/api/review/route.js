import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, ''); // Remove barra no final se existir
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Só inicializa se a URL for válida
const supabase = (supabaseUrl && supabaseUrl.startsWith('http'))
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function POST(request) {
  try {
    const { code, language } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Nenhum código fornecido' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Você é um revisor de código sênior experiente. 
    Sua tarefa é analisar o trecho de código enviado e fornecer um feedback estruturado em Markdown.
    Divida sua resposta nas seguintes seções:
    1. 📝 **Visão Geral**: Resumo do que o código faz.
    2. ✨ **Estilo e Boas Práticas**: Sugestões de legibilidade e padrões.
    3. 🚀 **Performance**: Possíveis gargalos e otimizações.
    4. 🛡️ **Segurança**: Vulnerabilidades detectadas.
    5. 💡 **Melhorias Sugeridas**: Exemplos de código refatorado.
    
    Linguagem: ${language || 'Auto-detectar'}
    Código:
    ${code}
    
    Seja construtivo, profissional e use um tom encorajador.`;

    const result = await model.generateContent(prompt);
    const feedback = result.response.text();

    // Salvar no Supabase (Opcional)
    if (supabase) {
      try {
        await supabase.from('reviews').insert([
          { code, feedback, language: language || 'Auto-detectar' }
        ]);
      } catch (dbError) {
        console.error('Supabase Save Error:', dbError);
      }
    }

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Gemini Error:', error);
    return NextResponse.json({ error: 'Erro ao processar a revisão' }, { status: 500 });
  }
}

export async function GET() {
  try {
    if (!supabase) return NextResponse.json([]);

    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Histórico Error:', error);
    return NextResponse.json([]); // Retorna vazio em vez de erro para não travar o front
  }
}
