package com.travel.config;

import com.travel.entity.Article;
import com.travel.entity.Tour;
import com.travel.entity.User;
import com.travel.enums.TourStatus;
import com.travel.enums.TourType;
import com.travel.enums.UserRole;
import com.travel.repository.ArticleRepository;
import com.travel.repository.TourRepository;
import com.travel.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * Khởi tạo dữ liệu ban đầu
 */
@Component
public class DataInitializer implements CommandLineRunner {    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TourRepository tourRepository;

    @Autowired
    private ArticleRepository articleRepository;

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
        
        // Tạo dữ liệu article mẫu
        initArticleData();
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
    
    /**
     * Khởi tạo dữ liệu article mẫu
     */
    private void initArticleData() {
        // Kiểm tra nếu đã có dữ liệu article thì không tạo thêm
        if (articleRepository.count() > 0) {
            return;
        }
        
        System.out.println("=== Bắt đầu tạo dữ liệu article mẫu ===");
        
        // Lấy admin user để làm author
        Optional<User> adminUserOpt = userRepository.findByUsername("admin");
        if (!adminUserOpt.isPresent()) {
            System.out.println("Không tìm thấy admin user, bỏ qua việc tạo article");
            return;
        }
        User adminUser = adminUserOpt.get();
        
        // Lấy một số tour để liên kết với articles
        List<Tour> tours = tourRepository.findAll();
        
        // Article 1: Kinh nghiệm du lịch Hà Nội
        Article hanoiArticle = new Article();
        hanoiArticle.setTitle("10 Điểm Tham Quan Không Thể Bỏ Lỡ Khi Du Lịch Hà Nội");
        hanoiArticle.setContent("Hà Nội - thủ đô nghìn năm văn hiến của Việt Nam, luôn thu hút du khách bởi vẻ đẹp cổ kính pha lẫn hiện đại. Với những con phố nhỏ uốn lượn, những ngôi đình chùa cổ kính và nền ẩm thực phong phú, Hà Nội là điểm đến lý tưởng cho những ai muốn khám phá văn hóa Việt Nam.\n\n" +
                "**1. Hồ Gươm và Đền Ngọc Sơn**\n" +
                "Hồ Gươm hay còn gọi là Hồ Hoàn Kiếm là trái tim của Hà Nội. Nơi đây không chỉ đẹp vào ban ngày mà còn lung linh về đêm với những ánh đèn rực rỡ. Đền Ngọc Sơn nằm trên đảo nhỏ giữa hồ, được nối với bờ bằng cây cầu Thê Húc màu đỏ tươi.\n\n" +
                "**2. Khu Phố Cổ Hà Nội**\n" +
                "36 phố phường cổ với lịch sử hàng trăm năm, mỗi phố mang một nét đặc trưng riêng. Từ phố Hàng Mã với những đồ trang trí đầy màu sắc đến phố Hàng Bạc với những sản phẩm bạc tinh xảo.\n\n" +
                "**3. Văn Miếu - Quốc Tử Giám**\n" +
                "Đây là ngôi trường đại học đầu tiên của Việt Nam, được xây dựng từ năm 1070. Nơi đây lưu giữ những giá trị văn hóa, giáo dục truyền thống của dân tộc.\n\n" +
                "**4. Hoàng Thành Thăng Long**\n" +
                "Di sản văn hóa thế giới được UNESCO công nhận, với những dấu tích lịch sử quý giá của triều đại Lý - Trần - Lê.\n\n" +
                "**5. Chùa Một Cột**\n" +
                "Một trong những biểu tượng của Hà Nội với kiến trúc độc đáo, được xây dựng theo hình dáng bông sen nở trên mặt nước.\n\n" +
                "Du lịch Hà Nội không chỉ là khám phá những danh lam thắng cảnh mà còn là trải nghiệm văn hóa, ẩm thực đặc sắc của vùng đất Bắc Bộ.");
        hanoiArticle.setSummary("Khám phá 10 điểm tham quan không thể bỏ lỡ khi du lịch Hà Nội - thủ đô nghìn năm văn hiến với những danh lam thắng cảnh nổi tiếng và nền văn hóa phong phú.");
        hanoiArticle.setFeaturedImageUrl("/uploads/articles/hanoi-travel.jpg");
        hanoiArticle.setAuthor(adminUser);
        hanoiArticle.setIsPublished(true);
        hanoiArticle.setViewCount(1250L);
        hanoiArticle.setTags(Arrays.asList("Du lịch", "Hà Nội", "Kinh nghiệm", "Phố cổ", "Văn hóa"));
        hanoiArticle.setMetaTitle("10 Điểm Tham Quan Không Thể Bỏ Lỡ Khi Du Lịch Hà Nội");
        hanoiArticle.setMetaDescription("Khám phá 10 điểm tham quan không thể bỏ lỡ khi du lịch Hà Nội - thủ đô nghìn năm văn hiến với những danh lam thắng cảnh nổi tiếng");
        hanoiArticle.setMetaKeywords("du lịch Hà Nội, điểm tham quan Hà Nội, phố cổ Hà Nội, văn miếu quốc tử giám, hồ gươm");
        if (!tours.isEmpty()) {
            hanoiArticle.setRelatedTours(Arrays.asList(tours.get(0))); // Liên kết với tour Hà Nội
        }
        
        // Article 2: Kinh nghiệm du lịch Hạ Long
        Article halongArticle = new Article();
        halongArticle.setTitle("Vịnh Hạ Long - Kỳ Quan Thiên Nhiên Thế Giới và Những Trải Nghiệm Tuyệt Vời");
        halongArticle.setContent("Vịnh Hạ Long - một trong bảy kỳ quan thiên nhiên mới của thế giới, là điểm đến không thể bỏ qua khi du lịch Việt Nam. Với hơn 1.600 hòn đảo đá vôi nhô lên từ mặt nước màu xanh ngọc bích, Vịnh Hạ Long tạo nên một bức tranh thiên nhiên hùng vĩ và thơ mộng.\n\n" +
                "**Những trải nghiệm không thể bỏ lỡ:**\n\n" +
                "**1. Du thuyền ngắm cảnh**\n" +
                "Đây là cách tốt nhất để khám phá vẻ đẹp của vịnh Hạ Long. Bạn có thể chọn các tour du thuyền từ nửa ngày đến 3 ngày 2 đêm, tùy theo thời gian và ngân sách.\n\n" +
                "**2. Khám phá các hang động**\n" +
                "Hang Sửng Sốt với những nhũ đá kỳ thú, Hang Đầu Gỗ với hệ thống ánh sáng đầy màu sắc, hay Hang Luồn với những trải nghiệm chèo kayak độc đáo.\n\n" +
                "**3. Tham quan làng chài**\n" +
                "Làng chài Cửa Vạn, Vung Viêng với cuộc sống bình dị của ngư dân địa phương, nơi bạn có thể học cách nuôi trồng thủy sản và thưởng thức hải sản tươi ngon.\n\n" +
                "**4. Hoạt động thể thao nước**\n" +
                "Chèo kayak khám phá các hang động, bơi lội trong làn nước trong xanh, hoặc câu cá mực vào ban đêm.\n\n" +
                "**Thời điểm tốt nhất để đi:**\n" +
                "Từ tháng 10 đến tháng 4 năm sau là thời gian lý tưởng nhất để du lịch Hạ Long với thời tiết mát mẻ, ít mưa và tầm nhìn tốt.");
        halongArticle.setSummary("Khám phá Vịnh Hạ Long - kỳ quan thiên nhiên thế giới với những trải nghiệm tuyệt vời từ du thuyền ngắm cảnh đến khám phá hang động và làng chài.");
        halongArticle.setFeaturedImageUrl("/uploads/articles/halong-bay.jpg");
        halongArticle.setAuthor(adminUser);
        halongArticle.setIsPublished(true);
        halongArticle.setViewCount(980L);
        halongArticle.setTags(Arrays.asList("Du lịch", "Hạ Long", "Kỳ quan", "Hang động", "Du thuyền"));
        halongArticle.setMetaTitle("Vịnh Hạ Long - Kỳ Quan Thiên Nhiên Thế Giới");
        halongArticle.setMetaDescription("Khám phá Vịnh Hạ Long - kỳ quan thiên nhiên thế giới với những trải nghiệm tuyệt vời từ du thuyền ngắm cảnh đến khám phá hang động");
        halongArticle.setMetaKeywords("vịnh hạ long, du lịch hạ long, kỳ quan thiên nhiên, hang động hạ long, du thuyền hạ long");
        if (tours.size() > 1) {
            halongArticle.setRelatedTours(Arrays.asList(tours.get(1))); // Liên kết với tour Hạ Long
        }
        
        // Article 3: Ẩm thực Việt Nam
        Article foodArticle = new Article();
        foodArticle.setTitle("Khám Phá Ẩm Thực Việt Nam - Hành Trình Qua Các Vùng Miền");
        foodArticle.setContent("Ẩm thực Việt Nam nổi tiếng thế giới với sự đa dạng, phong phú và đầy màu sắc. Mỗi vùng miền có những đặc sản riêng, phản ánh văn hóa và lịch sử của từng địa phương.\n\n" +
                "**Ẩm thực miền Bắc:**\n" +
                "Phở Hà Nội với nước dùng trong vắt, thơm ngon; Bún chả với thịt nướng thơm lừng; Chả cá Lã Vọng với hương vị đặc trưng của mắm tôm và thì là.\n\n" +
                "**Ẩm thực miền Trung:**\n" +
                "Bún bò Huế cay nồng đậm đà; Mì Quảng với nước lèo đầy đủ tôm cua; Bánh khoái, bánh bèo Huế tinh tế.\n\n" +
                "**Ẩm thực miền Nam:**\n" +
                "Phở Sài Gòn với rau sống phong phú; Bánh mì Việt Nam được CNN bình chọn là một trong những món ăn đường phố ngon nhất thế giới; Hủ tiếu Nam Vang thanh đạm.\n\n" +
                "**Những món ăn không thể bỏ lỡ:**\n" +
                "- Bánh cuốn Thanh Trì mỏng như lụa\n" +
                "- Nem rán giòn rụm\n" +
                "- Chè đậu đỏ, chè ba màu\n" +
                "- Cà phê phin truyền thống\n" +
                "- Bánh flan caramen\n\n" +
                "Mỗi món ăn Việt Nam đều mang trong mình một câu chuyện, một kỷ niệm và tình yêu của người làm ra nó.");
        foodArticle.setSummary("Khám phá ẩm thực Việt Nam đa dạng qua các vùng miền từ phở Hà Nội, bún bò Huế đến bánh mì Sài Gòn - hành trình vị giác tuyệt vời.");
        foodArticle.setFeaturedImageUrl("/uploads/articles/vietnamese-food.jpg");
        foodArticle.setAuthor(adminUser);
        foodArticle.setIsPublished(true);
        foodArticle.setViewCount(1680L);
        foodArticle.setTags(Arrays.asList("Ẩm thực", "Việt Nam", "Phở", "Bún bò Huế", "Bánh mì"));
        foodArticle.setMetaTitle("Khám Phá Ẩm Thực Việt Nam - Hành Trình Qua Các Vùng Miền");
        foodArticle.setMetaDescription("Khám phá ẩm thực Việt Nam đa dạng qua các vùng miền từ phở Hà Nội, bún bò Huế đến bánh mì Sài Gòn");
        foodArticle.setMetaKeywords("ẩm thực việt nam, phở việt nam, bún bò huế, bánh mì việt nam, món ăn việt nam");
        
        // Article 4: Du lịch bụi
        Article backpackingArticle = new Article();
        backpackingArticle.setTitle("Du Lịch Bụi Việt Nam - Hướng Dẫn Chi Tiết Cho Người Mới Bắt Đầu");
        backpackingArticle.setContent("Du lịch bụi (backpacking) là hình thức du lịch tự túc, tiết kiệm chi phí và mang lại những trải nghiệm thú vị, gần gũi với văn hóa địa phương. Việt Nam là điểm đến lý tưởng cho những ai muốn thử sức với du lịch bụi.\n\n" +
                "**Chuẩn bị cho chuyến đi:**\n\n" +
                "**1. Lập kế hoạch tuyến đường**\n" +
                "- Tuyến Bắc - Nam: Hà Nội → Sapa → Hạ Long → Huế → Hội An → Đà Lạt → TP.HCM\n" +
                "- Tuyến miền Trung: Đà Nẵng → Hội An → Huế → Phong Nha\n" +
                "- Tuyến Tây Nguyên: Đà Lạt → Buôn Ma Thuột → Kon Tum → Pleiku\n\n" +
                "**2. Chuẩn bị đồ dùng cần thiết**\n" +
                "- Ba lô 40-50L phù hợp\n" +
                "- Quần áo theo thời tiết\n" +
                "- Thuốc men cá nhân\n" +
                "- Giấy tờ tùy thân\n" +
                "- Tiền mặt và thẻ ATM\n\n" +
                "**3. Lựa chọn chỗ ở**\n" +
                "- Hostel: 100.000 - 200.000 VNĐ/đêm\n" +
                "- Homestay: 150.000 - 300.000 VNĐ/đêm\n" +
                "- Nhà nghỉ: 200.000 - 400.000 VNĐ/đêm\n\n" +
                "**4. Phương tiện di chuyển**\n" +
                "- Xe khách: Rẻ nhất, phù hợp đường dài\n" +
                "- Tàu hỏa: Thoải mái, ngắm cảnh đẹp\n" +
                "- Xe máy: Tự do, phù hợp đường ngắn\n" +
                "- Máy bay: Nhanh nhất, phù hợp khi có khuyến mãi\n\n" +
                "**Kinh nghiệm hay:**\n" +
                "- Học vài câu tiếng Việt cơ bản\n" +
                "- Tôn trọng văn hóa địa phương\n" +
                "- Luôn mang theo nước uống\n" +
                "- Đặt chỗ trước ở các địa điểm du lịch nổi tiếng");
        backpackingArticle.setSummary("Hướng dẫn chi tiết du lịch bụi Việt Nam cho người mới bắt đầu - từ lập kế hoạch, chuẩn bị đồ dùng đến lựa chọn phương tiện và chỗ ở tiết kiệm.");
        backpackingArticle.setFeaturedImageUrl("/uploads/articles/backpacking.jpg");
        backpackingArticle.setAuthor(adminUser);
        backpackingArticle.setIsPublished(true);
        backpackingArticle.setViewCount(756L);
        backpackingArticle.setTags(Arrays.asList("Du lịch bụi", "Backpacking", "Tiết kiệm", "Hướng dẫn", "Kinh nghiệm"));
        backpackingArticle.setMetaTitle("Du Lịch Bụi Việt Nam - Hướng Dẫn Chi Tiết Cho Người Mới Bắt Đầu");
        backpackingArticle.setMetaDescription("Hướng dẫn chi tiết du lịch bụi Việt Nam cho người mới bắt đầu - từ lập kế hoạch đến kinh nghiệm tiết kiệm chi phí");
        backpackingArticle.setMetaKeywords("du lịch bụi việt nam, backpacking việt nam, du lịch tiết kiệm, hướng dẫn du lịch bụi");
        
        // Article 5: Sapa và vùng cao
        Article sapaArticle = new Article();
        sapaArticle.setTitle("Sapa - Vẻ Đẹp Núi Rừng Tây Bắc và Văn Hóa Dân Tộc Thiểu Số");
        sapaArticle.setContent("Sapa, thị trấn nhỏ nằm ở độ cao 1.600m so với mặt nước biển, là điểm đến yêu thích của du khách trong và ngoài nước. Nơi đây nổi tiếng với khí hậu mát mẻ quanh năm, cảnh quan núi rừng hùng vĩ và văn hóa đa dạng của các dân tộc thiểu số.\n\n" +
                "**Những điểm đến không thể bỏ lỡ:**\n\n" +
                "**1. Đỉnh Fansipan - Nóc Nhà Đông Dương**\n" +
                "Với độ cao 3.143m, Fansipan là đỉnh núi cao nhất Việt Nam. Du khách có thể chinh phục bằng cách trekking 2 ngày 1 đêm hoặc đi cáp treo Muong Hoa.\n\n" +
                "**2. Thung lũng Mường Hoa**\n" +
                "Nơi có những ruộng bậc thang đẹp nhất Việt Nam, đặc biệt vào mùa lúa chín (tháng 9-10) khi cả thung lũng chuyển sang màu vàng óng.\n\n" +
                "**3. Các bản làng dân tộc**\n" +
                "- Bản Cát Cát: Dân tộc H'Mông Đen\n" +
                "- Bản Tả Van: Dân tộc Giáy\n" +
                "- Bản Tả Phìn: Dân tộc H'Mông Đỏ\n" +
                "- Bản Mã Tra: Dân tộc H'Mông\n\n" +
                "**4. Chợ tình Sapa**\n" +
                "Diễn ra vào tối thứ 7 hàng tuần, nơi các bạn trẻ dân tộc gặp gỡ, làm quen và tìm hiểu nhau.\n\n" +
                "**Hoạt động trải nghiệm:**\n" +
                "- Trekking khám phá các bản làng\n" +
                "- Homestay với gia đình địa phương\n" +
                "- Thưởng thức ẩm thực dân tộc\n" +
                "- Mua sắm thổ cẩm và đặc sản\n" +
                "- Ngắm mây nổi và săn mây\n\n" +
                "**Thời điểm đẹp nhất:**\n" +
                "- Tháng 3-5: Hoa đào, hoa mận nở\n" +
                "- Tháng 9-11: Mùa lúa chín, thời tiết đẹp");
        sapaArticle.setSummary("Khám phá Sapa - vẻ đẹp núi rừng Tây Bắc với đỉnh Fansipan, ruộng bậc thang Mường Hoa và văn hóa đặc sắc của các dân tộc thiểu số.");
        sapaArticle.setFeaturedImageUrl("/uploads/articles/sapa-terraces.jpg");
        sapaArticle.setAuthor(adminUser);
        sapaArticle.setIsPublished(true);
        sapaArticle.setViewCount(1120L);
        sapaArticle.setTags(Arrays.asList("Sapa", "Fansipan", "Ruộng bậc thang", "Dân tộc", "Tây Bắc"));
        sapaArticle.setMetaTitle("Sapa - Vẻ Đẹp Núi Rừng Tây Bắc và Văn Hóa Dân Tộc Thiểu Số");
        sapaArticle.setMetaDescription("Khám phá Sapa - vẻ đẹp núi rừng Tây Bắc với đỉnh Fansipan, ruộng bậc thang Mường Hoa và văn hóa dân tộc thiểu số");
        sapaArticle.setMetaKeywords("sapa, fansipan, ruộng bậc thang, dân tộc thiểu số, tây bắc việt nam");
        
        // Article 6: Du lịch mùa lễ hội
        Article festivalArticle = new Article();
        festivalArticle.setTitle("Lễ Hội Truyền Thống Việt Nam - Khám Phá Văn Hóa Qua Các Mùa Lễ Hội");
        festivalArticle.setContent("Lễ hội truyền thống là nét đẹp văn hóa độc đáo của Việt Nam, phản ánh lịch sử, tín ngưỡng và đời sống tinh thần của dân tộc. Tham gia các lễ hội là cách tuyệt vời để hiểu sâu hơn về văn hóa Việt Nam.\n\n" +
                "**Các lễ hội nổi tiếng:**\n\n" +
                "**1. Tết Nguyên Đán (Tháng 1-2 âm lịch)**\n" +
                "Lễ hội lớn nhất trong năm của người Việt. Du khách có thể trải nghiệm không khí Tết tại các chợ hoa, đền chùa, và thưởng thức các món ăn truyền thống.\n\n" +
                "**2. Lễ hội Chùa Hương (Tháng 1-3 âm lịch)**\n" +
                "Lễ hội lớn nhất miền Bắc với hàng triệu lượt du khách về cầu may, tại chùa Hương, Hà Nội.\n\n" +
                "**3. Lễ hội Đền Hùng (Tháng 3 âm lịch)**\n" +
                "Lễ hội tưởng nhớ các Vua Hùng - tổ tiên của dân tộc Việt Nam, tại Phú Thọ.\n\n" +
                "**4. Festival Huế (2 năm/lần)**\n" +
                "Lễ hội văn hóa quốc tế tại cố đô Huế với các chương trình nghệ thuật đặc sắc.\n\n" +
                "**5. Lễ hội Cầu Ngư (Tháng 1-3 âm lịch)**\n" +
                "Lễ hội của ngư dân miền biển, cầu cho mùa đánh bắt bình an, thuận lợi.\n\n" +
                "**6. Lễ hội Oóc Om Bóc (Tháng 10 âm lịch)**\n" +
                "Tết cổ truyền của đồng bào Khmer Nam Bộ, tương đương với Tết Nguyên Đán.\n\n" +
                "**Kinh nghiệm tham gia lễ hội:**\n" +
                "- Tìm hiểu ý nghĩa và quy tắc của lễ hội trước khi tham gia\n" +
                "- Ăn mặc lịch sự, phù hợp\n" +
                "- Tôn trọng các nghi lễ truyền thống\n" +
                "- Chuẩn bị tinh thần đông đúc\n" +
                "- Mang theo camera để lưu lại những khoảnh khắc đẹp");
        festivalArticle.setSummary("Khám phá văn hóa Việt Nam qua các lễ hội truyền thống từ Tết Nguyên Đán, Chùa Hương đến Festival Huế - trải nghiệm độc đáo không thể bỏ lỡ.");
        festivalArticle.setFeaturedImageUrl("/uploads/articles/traditional-festival.jpg");
        festivalArticle.setAuthor(adminUser);
        festivalArticle.setIsPublished(true);
        festivalArticle.setViewCount(892L);
        festivalArticle.setTags(Arrays.asList("Lễ hội", "Văn hóa", "Truyền thống", "Tết", "Festival"));
        festivalArticle.setMetaTitle("Lễ Hội Truyền Thống Việt Nam - Khám Phá Văn Hóa Qua Các Mùa Lễ Hội");
        festivalArticle.setMetaDescription("Khám phá văn hóa Việt Nam qua các lễ hội truyền thống từ Tết Nguyên Đán, Chùa Hương đến Festival Huế");
        festivalArticle.setMetaKeywords("lễ hội việt nam, tết nguyên đán, chùa hương, festival huế, văn hóa truyền thống");
        
        // Article 7: Phú Quốc
        Article phuquocArticle = new Article();
        phuquocArticle.setTitle("Phú Quốc - Đảo Ngọc Kiên Giang và Những Bãi Biển Tuyệt Đẹp");
        phuquocArticle.setContent("Phú Quốc, được mệnh danh là 'Đảo Ngọc' của Việt Nam, là điểm đến lý tưởng cho những ai yêu thích biển đảo. Với những bãi biển cát trắng mịn màng, làn nước trong xanh và hệ sinh thái phong phú, Phú Quốc ngày càng trở thành điểm đến hấp dẫn của du lịch Việt Nam.\n\n" +
                "**Những bãi biển đẹp nhất:**\n\n" +
                "**1. Bãi Sao (Bãi Khem)**\n" +
                "Được CNN bình chọn là một trong những bãi biển đẹp nhất thế giới với cát trắng mịn như bột và nước biển trong vắt.\n\n" +
                "**2. Bãi Dài**\n" +
                "Bãi biển dài nhất Phú Quốc với 20km cát trắng, nơi có những resort cao cấp và hoạt động thể thao nước.\n\n" +
                "**3. Bãi Kem**\n" +
                "Bãi biển hoang sơ với cảnh quan thiên nhiên nguyên sinh, phù hợp cho những ai muốn tìm sự yên tĩnh.\n\n" +
                "**Hoạt động trải nghiệm:**\n\n" +
                "**1. Câu cá và lặn ngắm san hô**\n" +
                "Tham gia tour câu cá trên biển hoặc lặn ngắm san hô tại các điểm như Hòn Thơm, Hòn Mây Rút.\n\n" +
                "**2. Tham quan vườn tiêu**\n" +
                "Phú Quốc nổi tiếng với tiêu đen chất lượng cao, du khách có thể tham quan các vườn tiêu và tìm hiểu quy trình sản xuất.\n\n" +
                "**3. Thưởng thức hải sản tươi sống**\n" +
                "Dinh dưỡng tôm hùm, cua ghẹ, cá tươi ngon được chế biến theo phong cách địa phương.\n\n" +
                "**4. Cáp treo Hòn Thơm**\n" +
                "Cáp treo biển dài nhất thế giới, mang đến trải nghiệm ngắm toàn cảnh đảo từ trên cao.\n\n" +
                "**5. Chợ đêm Phú Quốc**\n" +
                "Thưởng thức ẩm thực đường phố và mua sắm đặc sản như nước mắm, sim rượu.\n\n" +
                "**Thời điểm tốt nhất:** Từ tháng 10 đến tháng 4 năm sau với thời tiết khô ráo, ít mưa.");
        phuquocArticle.setSummary("Khám phá Phú Quốc - đảo ngọc Kiên Giang với những bãi biển tuyệt đẹp như Bãi Sao, Bãi Dài và trải nghiệm đa dạng từ lặn biển đến thưởng thức hải sản.");
        phuquocArticle.setFeaturedImageUrl("/uploads/articles/phu-quoc-beach.jpg");
        phuquocArticle.setAuthor(adminUser);
        phuquocArticle.setIsPublished(true);
        phuquocArticle.setViewCount(1350L);
        phuquocArticle.setTags(Arrays.asList("Phú Quốc", "Biển đảo", "Bãi Sao", "Hải sản", "Resort"));
        phuquocArticle.setMetaTitle("Phú Quốc - Đảo Ngọc Kiên Giang và Những Bãi Biển Tuyệt Đẹp");
        phuquocArticle.setMetaDescription("Khám phá Phú Quốc - đảo ngọc Kiên Giang với những bãi biển tuyệt đẹp như Bãi Sao, Bãi Dài và trải nghiệm đa dạng");
        phuquocArticle.setMetaKeywords("phú quốc, đảo ngọc, bãi sao, bãi dài, du lịch biển đảo việt nam");
        
        // Article 8: Kinh nghiệm du lịch tiết kiệm
        Article budgetTravelArticle = new Article();
        budgetTravelArticle.setTitle("7 Bí Quyết Du Lịch Tiết Kiệm Mà Vẫn Trọn Vẹn Trải Nghiệm");
        budgetTravelArticle.setContent("Du lịch không nhất thiết phải tốn kém để có những trải nghiệm tuyệt vời. Với một số mẹo nhỏ, bạn hoàn toàn có thể có những chuyến đi ý nghĩa mà vẫn tiết kiệm được chi phí đáng kể.\n\n" +
                "**1. Lập kế hoạch và đặt chỗ sớm**\n" +
                "Đặt vé máy bay, khách sạn sớm thường có giá tốt hơn. Theo dõi các trang web so sánh giá và đăng ký nhận thông báo khuyến mãi.\n\n" +
                "**2. Chọn thời điểm đi du lịch thông minh**\n" +
                "Tránh mùa cao điểm, lễ hội lớn. Du lịch vào các ngày trong tuần thường rẻ hơn cuối tuần.\n\n" +
                "**3. Chọn chỗ ở phù hợp**\n" +
                "- Hostel: Phù hợp với khách trẻ, có cơ hội gặp gỡ bạn bè mới\n" +
                "- Homestay: Trải nghiệm văn hóa địa phương, giá cả hợp lý\n" +
                "- Khách sạn mini: Cân bằng giữa giá cả và tiện nghi\n\n" +
                "**4. Sử dụng phương tiện công cộng**\n" +
                "Xe buýt, tàu hỏa thường rẻ hơn taxi hoặc xe riêng. Ở một số thành phố, có thể thuê xe đạp để di chuyển.\n\n" +
                "**5. Ăn như người địa phương**\n" +
                "Thử các quán ăn địa phương, chợ, xe đẩy thay vì nhà hàng du lịch. Vừa tiết kiệm vừa có trải nghiệm ẩm thực authentic.\n\n" +
                "**6. Tận dụng các hoạt động miễn phí**\n" +
                "- Tham quan công viên, bãi biển công cộng\n" +
                "- Khám phá các khu phố cổ\n" +
                "- Tham gia tour miễn phí (free walking tour)\n" +
                "- Tham quan bảo tàng vào ngày miễn phí\n\n" +
                "**7. Đóng gói thông minh**\n" +
                "Mang theo đồ dùng cá nhân để tránh mua ở điểm du lịch với giá cao. Chuẩn bị thuốc men cơ bản.\n\n" +
                "**Mẹo thêm:**\n" +
                "- Chia sẻ chi phí với bạn đồng hành\n" +
                "- Sử dụng ứng dụng du lịch để tìm deal tốt\n" +
                "- Mang theo bình nước để tiết kiệm tiền mua nước\n" +
                "- Học một số từ tiếng địa phương để giao tiếp dễ dàng hơn");
        budgetTravelArticle.setSummary("7 bí quyết du lịch tiết kiệm hiệu quả từ lập kế hoạch sớm, chọn chỗ ở phù hợp đến sử dụng phương tiện công cộng và ăn như người địa phương.");
        budgetTravelArticle.setFeaturedImageUrl("/uploads/articles/budget-travel.jpg");
        budgetTravelArticle.setAuthor(adminUser);
        budgetTravelArticle.setIsPublished(true);
        budgetTravelArticle.setViewCount(2180L);
        budgetTravelArticle.setTags(Arrays.asList("Du lịch tiết kiệm", "Bí quyết", "Ngân sách", "Kinh nghiệm", "Mẹo hay"));
        budgetTravelArticle.setMetaTitle("7 Bí Quyết Du Lịch Tiết Kiệm Mà Vẫn Trọn Vẹn Trải Nghiệm");
        budgetTravelArticle.setMetaDescription("7 bí quyết du lịch tiết kiệm hiệu quả từ lập kế hoạch sớm, chọn chỗ ở phù hợp đến ăn như người địa phương");
        budgetTravelArticle.setMetaKeywords("du lịch tiết kiệm, bí quyết du lịch rẻ, mẹo du lịch, ngân sách du lịch");
        
        // Lưu các article vào CSDL
        articleRepository.saveAll(Arrays.asList(
            hanoiArticle, halongArticle, foodArticle, backpackingArticle, 
            sapaArticle, festivalArticle, phuquocArticle, budgetTravelArticle
        ));
        
        System.out.println("=== Đã tạo " + articleRepository.count() + " article mẫu ===");
    }
}
