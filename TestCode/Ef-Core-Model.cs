using System.ComponentModel.DataAnnotations;

namespace MODEL
{
    public class BOARD
    {
        [Key]
        public string HISTORY_IDX { get; set; }

        [Required]
        public string TITLE { get; set; }

        [Required]
        public string WRITER { get; set; }

        public string LIKE_CNT { get; set; }

        public string VIEWS_CNT { get; set; }
        
        [Required]
        public string CONTENT { get; set; }

        public string COMMENT { get; set; }

        [Required]
        public DateTime WRITE_DT { get; set; }

        public string REMARK { get; set; }
    }
}
