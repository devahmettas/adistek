import { useEffect, useRef } from 'react'
import StaffActionToasts, { useStaffToasts } from '../StaffActionToasts'
import { useJewelrySaleCart } from '../../context/JewelrySaleCartContext'

export default function JewelrySaleToastListener() {
  const { saleVersion, saleMessage } = useJewelrySaleCart()
  const { toasts, pushToast, dismissToast } = useStaffToasts()
  const previousVersion = useRef(saleVersion)

  useEffect(() => {
    if (saleVersion > previousVersion.current) {
      pushToast('success', saleMessage)
      previousVersion.current = saleVersion
    }
  }, [saleVersion, saleMessage, pushToast])

  return (
    <div className="relative z-[80]">
      <StaffActionToasts toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
