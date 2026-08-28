namespace Api.Models;

public class Project
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string NameFa { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string SummaryFa { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string DescriptionFa { get; set; } = string.Empty;
    public string TagsJson { get; set; } = "[]";
    public string GalleryJson { get; set; } = "[]";
    public int Order { get; set; }
}