namespace Api.Models;

public class Service
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string TitleFa { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public string TextFa { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string GalleryJson { get; set; } = "[]";
    public int Order { get; set; }
}