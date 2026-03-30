interface FundCardSkeletonProps {
  code: string
  layoutMode: 'normal' | 'compact' | 'minimal'
}

export function FundCardSkeleton({ code, layoutMode }: FundCardSkeletonProps) {
  return (
    <div className={`fund-card fund-card-skeleton layout-${layoutMode}`} aria-busy="true" aria-label={`加载基金 ${code}`}>
      <div className="fund-header">
        <div className="fund-info">
          {/* 基金名称占位 */}
          <div className="skeleton" style={{ width: '160px', height: '16px', marginBottom: '6px' }} />
          {/* 代码占位：直接显示真实代码方便识别 */}
          <span className="fund-code">{code}</span>
        </div>
        <div className="fund-rate" style={{ alignItems: 'center', gap: '10px' }}>
          {/* 涨跌幅占位 */}
          <div className="skeleton" style={{ width: '72px', height: '28px', borderRadius: '6px' }} />
          {/* 删除按钮占位 */}
          <div className="skeleton" style={{ width: '28px', height: '28px', borderRadius: '7px' }} />
        </div>
      </div>

      {layoutMode !== 'minimal' && (
        <div className="fund-details">
          {['净值', '估值', '更新时间'].map((label) => (
            <div className="detail-item" key={label}>
              <span className="label">{label}</span>
              <div className="skeleton" style={{ width: '60px', height: '14px', borderRadius: '4px' }} />
            </div>
          ))}
        </div>
      )}

      {layoutMode === 'normal' && (
        <div className="skeleton" style={{ width: '100%', height: '32px', borderRadius: '7px' }} />
      )}
    </div>
  )
}
