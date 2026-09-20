/**
 * Labeled first-run chrome used while View as is active.
 * No live classrooms, children, or talk data.
 */
export default function RolePreviewEmpty({ title, children, icon: Icon }) {
    return (
        <div className="card bg-base-100 shadow-xl border border-dashed border-base-300">
            <div className="card-body items-center text-center py-12">
                {Icon && (
                    <div className="bg-primary/10 p-4 rounded-full mb-2">
                        <Icon className="w-8 h-8 text-primary" />
                    </div>
                )}
                <h3 className="card-title">{title}</h3>
                <p className="text-base-content/70 max-w-md">{children}</p>
            </div>
        </div>
    );
}
