package com.travel.config;

import com.travel.entity.Tour;
import com.travel.entity.User;
import com.travel.enums.TourStatus;
import com.travel.enums.TourType;
import com.travel.enums.UserRole;
import com.travel.repository.TourRepository;
import com.travel.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;

/**
 * Khởi tạo dữ liệu ban đầu
 */
@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TourRepository tourRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Tạo admin mặc định nếu chưa có
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail("admin@travelbooking.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setFullName("Administrator");
            admin.setRole(UserRole.ADMIN);
            admin.setIsActive(true);
            admin.setIsEmailVerified(true);
            
            userRepository.save(admin);
            System.out.println("=== Đã tạo tài khoản admin mặc định ===");
            System.out.println("Username: admin");
            System.out.println("Password: admin123");
            System.out.println("========================================");
        }

        // Tạo user demo
        if (!userRepository.existsByUsername("demo")) {
            User demo = new User();
            demo.setUsername("demo");
            demo.setEmail("demo@travelbooking.com");
            demo.setPassword(passwordEncoder.encode("demo123"));
            demo.setFullName("Demo User");
            demo.setRole(UserRole.USER);
            demo.setIsActive(true);
            demo.setIsEmailVerified(true);
            
            userRepository.save(demo);
            System.out.println("=== Đã tạo tài khoản demo ===");
            System.out.println("Username: demo");
            System.out.println("Password: demo123");
            System.out.println("=============================");
        }
        
        // Tạo dữ liệu tour mẫu
        initTourData();
    }
    
    /**
     * Khởi tạo dữ liệu tour mẫu
     */
    private void initTourData() {
        // Kiểm tra nếu đã có dữ liệu tour thì không tạo thêm
        if (tourRepository.count() > 0) {
            return;
        }
        
        System.out.println("=== Bắt đầu tạo dữ liệu tour mẫu ===");
        
        // Tour trong nước
        Tour hanoiTour = new Tour();
        hanoiTour.setName("Khám phá Hà Nội cổ kính - 3 ngày 2 đêm");
        hanoiTour.setDescription("Hành trình khám phá Hà Nội với những điểm tham quan nổi tiếng như Hồ Gươm, Văn Miếu, Hoàng Thành Thăng Long, và thưởng thức ẩm thực đường phố.");
        hanoiTour.setPrice(new BigDecimal("1500000"));
        hanoiTour.setDepartureDate(LocalDate.now().plusDays(30));
        hanoiTour.setReturnDate(LocalDate.now().plusDays(32));
        hanoiTour.setDestination("Hà Nội");
        hanoiTour.setDepartureLocation("TP. Hồ Chí Minh");
        hanoiTour.setMaxParticipants(20);
        hanoiTour.setCurrentParticipants(0);
        hanoiTour.setStatus(TourStatus.ACTIVE);
        hanoiTour.setTourType(TourType.DOMESTIC);
        hanoiTour.setDurationDays(3);
        hanoiTour.setItinerary("**Ngày 1:** Khởi hành từ TP.HCM, tham quan Văn Miếu - Quốc Tử Giám\n**Ngày 2:** Tham quan Hồ Gươm, Nhà hát Lớn, Phố Cổ\n**Ngày 3:** Khám phá Làng gốm Bát Tràng, trở về TP.HCM");
        hanoiTour.setIncludes("Vé máy bay khứ hồi, khách sạn 3 sao, các bữa ăn theo chương trình, xe đưa đón, hướng dẫn viên, vé tham quan");
        hanoiTour.setExcludes("Chi phí cá nhân, các bữa ăn ngoài chương trình");
        hanoiTour.setIsFeatured(true);
        hanoiTour.setMainImageUrl("/uploads/tours/hanoi.jpg");
        
        Tour haLongTour = new Tour();
        haLongTour.setName("Du ngoạn Vịnh Hạ Long - 2 ngày 1 đêm");
        haLongTour.setDescription("Khám phá kỳ quan thiên nhiên thế giới với hành trình ngủ đêm trên vịnh Hạ Long, tham quan hang động và các đảo đá.");
        haLongTour.setPrice(new BigDecimal("2500000"));
        haLongTour.setDepartureDate(LocalDate.now().plusDays(15));
        haLongTour.setReturnDate(LocalDate.now().plusDays(16));
        haLongTour.setDestination("Vịnh Hạ Long, Quảng Ninh");
        haLongTour.setDepartureLocation("Hà Nội");
        haLongTour.setMaxParticipants(15);
        haLongTour.setCurrentParticipants(5);
        haLongTour.setStatus(TourStatus.ACTIVE);
        haLongTour.setTourType(TourType.DOMESTIC);
        haLongTour.setDurationDays(2);
        haLongTour.setItinerary("**Ngày 1:** Khởi hành từ Hà Nội, lên tàu tham quan vịnh Hạ Long, thăm hang Sửng Sốt\n**Ngày 2:** Ngắm bình minh trên vịnh, chèo thuyền kayak, về lại Hà Nội");
        haLongTour.setIncludes("Xe đưa đón từ Hà Nội, tàu tham quan, cabin trên tàu, các bữa ăn, vé tham quan, hướng dẫn viên");
        haLongTour.setExcludes("Đồ uống, tiền tip, chi phí cá nhân");
        haLongTour.setIsFeatured(true);
        haLongTour.setMainImageUrl("/uploads/tours/halong.jpg");
        
        Tour daNangTour = new Tour();
        daNangTour.setName("Khám phá Đà Nẵng - Hội An - Bà Nà Hills - 4 ngày 3 đêm");
        daNangTour.setDescription("Hành trình khám phá miền Trung với Đà Nẵng năng động, Hội An cổ kính và Bà Nà Hills với Cầu Vàng nổi tiếng.");
        daNangTour.setPrice(new BigDecimal("4500000"));
        daNangTour.setDepartureDate(LocalDate.now().plusDays(45));
        daNangTour.setReturnDate(LocalDate.now().plusDays(48));
        daNangTour.setDestination("Đà Nẵng, Hội An, Bà Nà Hills");
        daNangTour.setDepartureLocation("TP. Hồ Chí Minh");
        daNangTour.setMaxParticipants(25);
        daNangTour.setCurrentParticipants(10);
        daNangTour.setStatus(TourStatus.ACTIVE);
        daNangTour.setTourType(TourType.DOMESTIC);
        daNangTour.setDurationDays(4);
        daNangTour.setItinerary("**Ngày 1:** Khởi hành từ TP.HCM, tham quan Bán đảo Sơn Trà\n**Ngày 2:** Khám phá Bà Nà Hills, Cầu Vàng\n**Ngày 3:** Tham quan Phố cổ Hội An\n**Ngày 4:** Mua sắm tại Đà Nẵng, trở về TP.HCM");
        daNangTour.setIncludes("Vé máy bay khứ hồi, khách sạn 4 sao, các bữa ăn theo chương trình, vé Bà Nà Hills, xe đưa đón, hướng dẫn viên");
        daNangTour.setExcludes("Chi phí cá nhân, mua sắm");
        daNangTour.setIsFeatured(true);
        daNangTour.setMainImageUrl("/uploads/tours/danang.jpg");
        
        // Tour quốc tế
        Tour bangkokTour = new Tour();
        bangkokTour.setName("Khám phá Bangkok - Pattaya - 5 ngày 4 đêm");
        bangkokTour.setDescription("Hành trình khám phá Thái Lan với Bangkok sôi động và Pattaya xinh đẹp, tham quan các điểm du lịch nổi tiếng và trải nghiệm văn hóa Thái.");
        bangkokTour.setPrice(new BigDecimal("8500000"));
        bangkokTour.setDepartureDate(LocalDate.now().plusDays(60));
        bangkokTour.setReturnDate(LocalDate.now().plusDays(64));
        bangkokTour.setDestination("Bangkok, Pattaya");
        bangkokTour.setDepartureLocation("TP. Hồ Chí Minh");
        bangkokTour.setMaxParticipants(20);
        bangkokTour.setCurrentParticipants(8);
        bangkokTour.setStatus(TourStatus.ACTIVE);
        bangkokTour.setTourType(TourType.INTERNATIONAL);
        bangkokTour.setDurationDays(5);
        bangkokTour.setItinerary("**Ngày 1:** Khởi hành từ TP.HCM, tham quan Chùa Phật Vàng\n**Ngày 2:** Tham quan Cung điện Hoàng gia, chợ nổi\n**Ngày 3-4:** Khám phá Pattaya, tham quan đảo Coral\n**Ngày 5:** Mua sắm tại Bangkok, trở về TP.HCM");
        bangkokTour.setIncludes("Vé máy bay khứ hồi, khách sạn 4 sao, các bữa ăn theo chương trình, vé tham quan, xe đưa đón, hướng dẫn viên, bảo hiểm du lịch");
        bangkokTour.setExcludes("Chi phí cá nhân, tiền tip, visa (đối với một số quốc tịch)");
        bangkokTour.setIsFeatured(true);
        bangkokTour.setMainImageUrl("/uploads/tours/bangkok.jpg");
        
        Tour tokyoTour = new Tour();
        tokyoTour.setName("Khám phá Tokyo - Osaka - Kyoto - 7 ngày 6 đêm");
        tokyoTour.setDescription("Hành trình khám phá Nhật Bản với Tokyo hiện đại, Osaka sôi động và Kyoto cổ kính, trải nghiệm văn hóa và ẩm thực Nhật Bản.");
        tokyoTour.setPrice(new BigDecimal("35000000"));
        tokyoTour.setDepartureDate(LocalDate.now().plusDays(90));
        tokyoTour.setReturnDate(LocalDate.now().plusDays(96));
        tokyoTour.setDestination("Tokyo, Osaka, Kyoto");
        tokyoTour.setDepartureLocation("TP. Hồ Chí Minh");
        tokyoTour.setMaxParticipants(15);
        tokyoTour.setCurrentParticipants(5);
        tokyoTour.setStatus(TourStatus.ACTIVE);
        tokyoTour.setTourType(TourType.INTERNATIONAL);
        tokyoTour.setDurationDays(7);
        tokyoTour.setItinerary("**Ngày 1-2:** Khởi hành từ TP.HCM, tham quan Tokyo\n**Ngày 3-4:** Khám phá Osaka, Universal Studios\n**Ngày 5-6:** Tham quan Kyoto, chùa Kinkakuji\n**Ngày 7:** Mua sắm tại Tokyo, trở về TP.HCM");
        tokyoTour.setIncludes("Vé máy bay khứ hồi, khách sạn 4 sao, các bữa ăn theo chương trình, vé tham quan, xe đưa đón, hướng dẫn viên, bảo hiểm du lịch, visa Nhật Bản");
        tokyoTour.setExcludes("Chi phí cá nhân, tiền tip, các bữa ăn tự túc");
        tokyoTour.setIsFeatured(false);
        tokyoTour.setMainImageUrl("/uploads/tours/tokyo.jpg");
        
        Tour parisTour = new Tour();
        parisTour.setName("Khám phá Paris - Rome - 10 ngày 9 đêm");
        parisTour.setDescription("Hành trình khám phá châu Âu với Paris lãng mạn và Rome cổ kính, tham quan các điểm du lịch nổi tiếng và trải nghiệm văn hóa Âu châu.");
        parisTour.setPrice(new BigDecimal("65000000"));
        parisTour.setDepartureDate(LocalDate.now().plusDays(120));
        parisTour.setReturnDate(LocalDate.now().plusDays(129));
        parisTour.setDestination("Paris, Rome");
        parisTour.setDepartureLocation("Hà Nội");
        parisTour.setMaxParticipants(12);
        parisTour.setCurrentParticipants(3);
        parisTour.setStatus(TourStatus.ACTIVE);
        parisTour.setTourType(TourType.INTERNATIONAL);
        parisTour.setDurationDays(10);
        parisTour.setItinerary("**Ngày 1-4:** Khởi hành từ Hà Nội, tham quan Paris, Tháp Eiffel, Bảo tàng Louvre\n**Ngày 5-9:** Khám phá Rome, Vatican, Đấu trường La Mã\n**Ngày 10:** Trở về Hà Nội");
        parisTour.setIncludes("Vé máy bay khứ hồi, khách sạn 4 sao, các bữa ăn theo chương trình, vé tham quan, xe đưa đón, hướng dẫn viên, bảo hiểm du lịch, visa Schengen");
        parisTour.setExcludes("Chi phí cá nhân, tiền tip, các bữa ăn tự túc");
        parisTour.setIsFeatured(false);
        parisTour.setMainImageUrl("/uploads/tours/paris.jpg");
        
        // Lưu các tour vào CSDL
        tourRepository.saveAll(Arrays.asList(hanoiTour, haLongTour, daNangTour, bangkokTour, tokyoTour, parisTour));
        
        System.out.println("=== Đã tạo " + tourRepository.count() + " tour mẫu ===");
    }
}
