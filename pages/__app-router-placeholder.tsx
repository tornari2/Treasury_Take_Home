import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
  return { notFound: true };
};

export default function AppRouterPlaceholderPage() {
  return null;
}
