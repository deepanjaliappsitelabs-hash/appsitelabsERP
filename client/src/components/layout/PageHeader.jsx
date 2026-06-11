function PageHeader({
  title,
  subtitle,
  action,
}) {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          {title}
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          {subtitle}
        </p>
      </div>

      {action}
    </div>
  );
}

export default PageHeader;
