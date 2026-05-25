using Google.Apis.Auth;
using Google.Apis.Auth;
using MailKit.Net.Smtp;
using MailKit.Security;
using march.Data;
using march.Helpers;
using march.models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MimeKit;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Twilio;
using Twilio.Rest.Api.V2010.Account;

namespace march.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        // 🔐 LOGIN
        [HttpPost("login")]
        public IActionResult Login(User user)
        {
            var existingUser = _context.Users
                .FirstOrDefault(x => x.Username == user.Username && x.Password == user.Password);

            if (existingUser == null)
                return Unauthorized();

            var token = GenerateToken(existingUser);
            return Ok(new { token });
        }


        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(request.Token);
            var email = payload.Email;
            var user = _context.Users.FirstOrDefault(x => x.Username == email);
            if (user == null)
            {
                user = new User
                {
                    Username = email,
                    Password = "GoogleUser"
                };
                _context.Users.Add(user);
                _context.SaveChanges();
            }
            var jwt = GenerateToken(user);
            return Ok(new { token = jwt });
        }

        public class GoogleLoginRequest
        {
            public string Token { get; set; }
        }

        // 📧 SEND OTP
        [HttpPost("send-otp")]
        public IActionResult SendOtp([FromBody] string email)
        {
            var otp = GenerateOtp();

            OtpStore.OtpList.RemoveAll(x => x.Email == email);

            OtpStore.OtpList.Add(new OtpEntry
            {
                Email = email,
                Otp = otp,
                ExpiryTime = DateTime.Now.AddMinutes(5)
            });

            SendEmail(email, otp);

            return Ok(new { message = "OTP sent" });
        }

        [HttpPost("send-otp-phone")]
        public IActionResult SendOtpPhone([FromBody] string phoneNumber)
        {
            var otp = GenerateOtp();

            // Store OTP (reusing your existing OtpStore)
            OtpStore.OtpList.RemoveAll(x => x.Email == phoneNumber);
            OtpStore.OtpList.Add(new OtpEntry
            {
                Email = phoneNumber,  // reusing Email field for phone
                Otp = otp,
                ExpiryTime = DateTime.Now.AddMinutes(5)
            });

            // Send SMS
            TwilioClient.Init(
                _config["Twilio:AccountSid"],
                _config["Twilio:AuthToken"]
            );

            MessageResource.Create(
                body: $"Your OTP is: {otp}",
                from: new Twilio.Types.PhoneNumber(_config["Twilio:FromNumber"]),
                to: new Twilio.Types.PhoneNumber(phoneNumber)
            );

            return Ok(new { message = "OTP sent to phone" });
        }


        // ✅ VERIFY PHONE OTP + REGISTER
        [HttpPost("verify-otp-phone-register")]
        public IActionResult VerifyOtpPhoneRegister([FromBody] RegisterRequest data)
        {
            string phone = data.Username;
            string password = data.Password;
            string otp = data.Otp;

            var entry = OtpStore.OtpList
                .FirstOrDefault(x => x.Email == phone && x.Otp == otp);

            if (entry == null || entry.ExpiryTime < DateTime.Now)
                return BadRequest("Invalid or expired OTP");

            var user = new User
            {
                Username = phone,
                Password = password
            };

            _context.Users.Add(user);
            _context.SaveChanges();

            OtpStore.OtpList.Remove(entry);

            var token = GenerateToken(user);
            return Ok(new { token });
        }

        // ✅ VERIFY OTP + REGISTER
        [HttpPost("verify-otp-register")]
        public IActionResult VerifyOtpRegister([FromBody] RegisterRequest data)
        {
            string email = data.Username;
            string password = data.Password;
            string otp = data.Otp;

            var entry = OtpStore.OtpList
                .FirstOrDefault(x => x.Email == email && x.Otp == otp);

            if (entry == null || entry.ExpiryTime < DateTime.Now)
                return BadRequest("Invalid or expired OTP");

            var user = new User
            {
                Username = email,
                Password = password
            };

            _context.Users.Add(user);
            _context.SaveChanges();

            OtpStore.OtpList.Remove(entry);

            var token = GenerateToken(user);
            return Ok(new { token });
        }

        // 🔢 GENERATE OTP
        private string GenerateOtp()
        {
            Random random = new Random();
            return random.Next(100000, 999999).ToString();
        }

        // 📩 SEND EMAIL
        private void SendEmail(string toEmail, string otp)
        {
            try
            {
                var email = new MimeMessage();
                email.From.Add(new MailboxAddress("My App", "chhabradheeraj9306@gmail.com"));
                email.To.Add(MailboxAddress.Parse(toEmail));
                email.Subject = "OTP Verification";
                email.Body = new TextPart("plain")
                {
                    Text = $"Your OTP is: {otp}"
                };

                using var smtp = new SmtpClient();

                Console.WriteLine("Step 1: Connecting...");
                smtp.Connect("smtp.gmail.com", 587, SecureSocketOptions.StartTls);

                Console.WriteLine("Step 2: Authenticating...");
                smtp.Authenticate("chhabradheeraj9306@gmail.com", "qjeajgturrgyjhok");

                Console.WriteLine("Step 3: Sending Email...");
                smtp.Send(email);

                smtp.Disconnect(true);

                Console.WriteLine("✅ Email Sent Successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine("❌ FULL ERROR: " + ex.ToString());
                throw;
            }
        }

        // 🔑 JWT TOKEN
        private string GenerateToken(User user)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.Name, user.Username)
            };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_config["Jwt:Key"])
            );

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                claims: claims,
                expires: DateTime.Now.AddHours(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }


    }
}