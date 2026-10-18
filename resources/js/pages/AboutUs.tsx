import FooterPage, { type FooterPageDetail } from '@/pages/FooterPage';

export default function AboutUs({
    auth,
    page,
}: {
    auth: { user: any };
    page?: FooterPageDetail | null;
}) {
    return <FooterPage auth={auth} slug="about-us" page={page} />;
}
