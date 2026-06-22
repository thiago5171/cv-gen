declare module "html2pdf.js" {
  type Html2PdfInstance = {
    set: (options: Record<string, unknown>) => Html2PdfInstance;
    from: (element: HTMLElement | string) => Html2PdfInstance;
    toContainer: () => Html2PdfInstance;
    toCanvas: () => Html2PdfInstance;
    toImg: () => Html2PdfInstance;
    toPdf: () => Html2PdfInstance;
    output: (type: string, options?: unknown) => Promise<Blob>;
    outputPdf: (type: string, options?: unknown) => Promise<Blob>;
    save: (filename?: string) => Promise<void>;
  };

  const html2pdf: () => Html2PdfInstance;
  export default html2pdf;
}
