export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="admin-wrapper">
            {/* Tutaj możesz dodać np. Sidebar tylko dla admina */}
            {children}
        </div>
    );
}