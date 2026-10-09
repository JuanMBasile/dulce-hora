import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { renderToPipeableStream } from "react-dom/server";
import { ServerRouter, type EntryContext } from "react-router";

// El sitio es estático: el servidor solo corre en el build, para prerenderizar.
// La entrada por defecto espera todo el contenido únicamente para bots (el prerender no
// manda user-agent) y React manda aparte, en un <div hidden> que solo JavaScript ubica,
// todo límite de Suspense de más de 12 800 bytes. Una sección diferida (React.lazy) no se
// vería sin JavaScript. Acá se espera todo (`onAllReady`, como pide React para la
// generación estática) y nada se separa (`progressiveChunkSize`): cada sección queda
// completa y en su lugar en el HTML.
export const streamTimeout = 5_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, { status: responseStatusCode, headers: responseHeaders });
  }

  return new Promise<Response>((resolve, reject) => {
    let shellRendered = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined = setTimeout(() => abort(), streamTimeout + 1000);

    const { pipe, abort } = renderToPipeableStream(<ServerRouter context={routerContext} url={request.url} />, {
      progressiveChunkSize: Number.POSITIVE_INFINITY,
      onAllReady() {
        shellRendered = true;
        const body = new PassThrough({
          final(callback) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
            callback();
          },
        });
        responseHeaders.set("Content-Type", "text/html");
        pipe(body);
        resolve(
          new Response(createReadableStreamFromReadable(body), {
            headers: responseHeaders,
            status: responseStatusCode,
          }),
        );
      },
      onShellError(error: unknown) {
        reject(error);
      },
      onError(error: unknown) {
        responseStatusCode = 500;
        // Los errores del shell ya los registra React Router; acá van los de las secciones.
        if (shellRendered) console.error(error);
      },
    });
  });
}
