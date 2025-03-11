export const getServerSideProps = async () => {
  return {
    redirect: {
      destination: '/auth/signin',
      permanent: false,
    },
  };
};

export default function Home() {
  return null;
}