import { Transform } from 'class-transformer';

/** Tira espaços das pontas de textos antes de validar. */
export const Trim = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

/** E-mail sempre em minúsculas e sem espaços. */
export const Minusculas = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value));
