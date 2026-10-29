"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ehAdmin, getEscolaAtual, getUsuario } from "../lib/api";

/**
 * Usado nas páginas de administração (professores, alunos, turmas, aulas, relatórios).
 * Só deixa passar admin de escola ou o dono do sistema. Sem login manda pro /login;
 * professor/aluno vai pra área dele; o dono do sistema precisa escolher uma escola antes.
 */
export function useSomenteAdmin() {
  const router = useRouter();

  useEffect(() => {
    const usuario = getUsuario();
    if (!usuario) {
      router.replace("/login");
      return;
    }
    if (!ehAdmin(usuario.role)) {
      router.replace("/minhas-aulas");
      return;
    }
    if (usuario.role === "SUPERADMIN" && !getEscolaAtual()) {
      router.replace("/escolas");
    }
  }, [router]);
}

/** Páginas só do dono do sistema (gestão de escolas). */
export function useSomenteSuperAdmin() {
  const router = useRouter();

  useEffect(() => {
    const usuario = getUsuario();
    if (!usuario) {
      router.replace("/login");
    } else if (usuario.role !== "SUPERADMIN") {
      router.replace(ehAdmin(usuario.role) ? "/" : "/minhas-aulas");
    }
  }, [router]);
}
