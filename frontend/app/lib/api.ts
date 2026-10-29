export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export type Papel = "SUPERADMIN" | "ADMIN" | "PROFESSOR" | "ALUNO";

export type EscolaResumo = { id: number; nome: string; logoUrl: string | null };

export type Usuario = {
  role: Papel;
  id?: number;
  nome: string;
  email: string;
  serie?: string;
  disciplina?: string;
  escola?: EscolaResumo;
};

export const ehAdmin = (role?: Papel) => role === "ADMIN" || role === "SUPERADMIN";

// Todas as funções abaixo só podem rodar no navegador (useEffect / handlers).

export function getUsuario(): Usuario | null {
  try {
    const raw = localStorage.getItem("cb_usuario");
    return raw ? (JSON.parse(raw) as Usuario) : null;
  } catch {
    return null;
  }
}

/** Escola em uso: a escolhida pelo dono do sistema ou a escola do próprio usuário. */
export function getEscolaAtual(): EscolaResumo | null {
  const usuario = getUsuario();
  if (!usuario) return null;
  if (usuario.role !== "SUPERADMIN") return usuario.escola ?? null;
  try {
    const raw = localStorage.getItem("cb_escola");
    return raw ? (JSON.parse(raw) as EscolaResumo) : null;
  } catch {
    return null;
  }
}

/** Atualiza a escola em uso (e avisa o cabeçalho). */
export function setEscolaAtual(escola: EscolaResumo | null) {
  const usuario = getUsuario();
  if (usuario?.role === "SUPERADMIN") {
    if (escola) localStorage.setItem("cb_escola", JSON.stringify(escola));
    else localStorage.removeItem("cb_escola");
  } else if (usuario && escola) {
    localStorage.setItem("cb_usuario", JSON.stringify({ ...usuario, escola }));
  }
  window.dispatchEvent(new Event("cb:escola"));
}

export function sair() {
  localStorage.removeItem("cb_token");
  localStorage.removeItem("cb_usuario");
  localStorage.removeItem("cb_escola");
}

export function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("cb_token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const usuario = getUsuario();
  if (usuario?.role === "SUPERADMIN") {
    const escola = getEscolaAtual();
    if (escola) headers["x-escola-id"] = String(escola.id);
  }
  return headers;
}

export type Resposta<T> = { ok: boolean; status: number; data: T | null; erro: string | null };

/** fetch autenticado que já devolve o JSON e a mensagem de erro da API. */
export async function chamar<T = unknown>(path: string, init: RequestInit = {}): Promise<Resposta<T>> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { ...authHeaders(), ...(init.headers as Record<string, string> | undefined) },
    });
    if (res.status === 401) {
      sair();
      window.location.href = "/login";
    }
    const corpo = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = Array.isArray(corpo?.message) ? corpo.message.join(" ") : corpo?.message;
      return { ok: false, status: res.status, data: null, erro: msg || "Algo deu errado. Tente de novo." };
    }
    return { ok: true, status: res.status, data: corpo as T, erro: null };
  } catch {
    return { ok: false, status: 0, data: null, erro: "Não foi possível falar com o servidor." };
  }
}
