export type PageParams = {
  lang: string;
  slug?: string;
};

export type PageProps = {
  params: Promise<PageParams>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export type LayoutProps = {
  children: React.ReactNode;
  params: Promise<PageParams>;
};
