import { heroCopy, site } from "~/data/site";
import type { Route } from "./+types/home";

export function meta(): Route.MetaDescriptors {
  return [
    { title: "Dulce Hora | Panadería y pastelería" },
    { name: "description", content: site.description },
  ];
}

export default function Home() {
  return (
    <main id="contenido">
      <h1>{heroCopy.title}</h1>
      <p>{heroCopy.lead}</p>
    </main>
  );
}
