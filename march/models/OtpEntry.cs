namespace march.models
{
    public class OtpEntry
    {
        public string Email { get; set; }
        public string Otp { get; set; }
        public DateTime ExpiryTime { get; set; }
    }
}
