import * as Notification from "../../Utils/Notifications.js";

import { ActionTextInputField } from "./HelperInputFields";
import CareIcon from "../../CAREUI/icons/CareIcon";
import DialogModal from "./Dialog";
import QrReader from "react-qr-reader";
import { useState } from "react";

interface IQRScannerModalProps {
  show: boolean;
  onClose: () => void;
  onScan: (scannedValue: any) => any;
  description?: string;
  disabled?: boolean;
}

const QRScannerModal = ({
  show,
  onClose,
  onScan,
  description,
  disabled = false,
}: IQRScannerModalProps) => {
  return (
    <DialogModal
      title=""
      show={!disabled && show}
      onClose={onClose}
      className="!max-w-full w-3/5"
    >
      <div className="md:w-1/2 w-full my-2 mx-auto flex flex-col justify-start items-end">
        <h2 className="text-center text-lg self-center mb-4">
          {description || "Scan QR code!"}
        </h2>
        <QrReader
          delay={300}
          onScan={onScan}
          onError={(e: any) =>
            Notification.Error({
              msg: e.message,
            })
          }
          style={{ width: "100%" }}
        />
      </div>
    </DialogModal>
  );
};

interface IProps {
  value: string;
  onChange: (value: string) => void;
  parse?: (scannedValue: any) => any;
  className?: string;
  error?: string;
  label?: string;
  disabled?: boolean;
}

const QRScanner = ({
  value,
  onChange,
  parse,
  disabled = false,
  className = "",
  error = "",
  label = "QR Code",
}: IProps) => {
  const [showScanner, setShowScanner] = useState(false);

  return (
    <div className={className}>
      <label htmlFor="asset-qr-id">{label}</label>
      <ActionTextInputField
        id="qr_code_id"
        fullWidth
        name="qr_code_id"
        placeholder=""
        variant="outlined"
        margin="dense"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        actionIcon={<CareIcon className="care-l-focus text-black" />}
        action={() => setShowScanner(true)}
        errors={error}
        disabled={disabled}
      />

      <QRScannerModal
        show={showScanner}
        disabled={disabled}
        onClose={() => setShowScanner(false)}
        onScan={async (scannedValue: any) => {
          const parsedValue = (await parse?.(scannedValue)) ?? null;
          if (parsedValue) {
            onChange(parsedValue);
            setShowScanner(false);
          }
        }}
      />
    </div>
  );
};

export default QRScanner;
