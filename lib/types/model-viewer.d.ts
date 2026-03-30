import type { ModelViewerElement } from "@google/model-viewer";
import type * as React from "react";

type ModelViewerIntrinsicProps = React.DetailedHTMLProps<
    React.HTMLAttributes<ModelViewerElement>,
    ModelViewerElement
> & {
    alt?: string;
    src?: string;
    poster?: string;
    loading?: "auto" | "eager" | "lazy";
    reveal?: "auto" | "interaction" | "manual";
    exposure?: number | string;
    "camera-controls"?: boolean | string;
    "interaction-prompt"?: "auto" | "when-focused" | "none";
    "shadow-intensity"?: number | string;
    "environment-image"?: string;
};

declare module "react/jsx-runtime" {
    namespace JSX {
        interface IntrinsicElements {
            "model-viewer": ModelViewerIntrinsicProps;
        }
    }
}

export {};
